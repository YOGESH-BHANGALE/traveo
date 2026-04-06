process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../config/db', () => jest.fn());
jest.mock('../config/passport', () => ({ initialize: () => (req, res, next) => next() }));
jest.mock('../services/notificationService', () => ({ configurePush: jest.fn() }));

// Mock models
jest.mock('../models/Trip', () => {
  const TripMock = jest.fn();
  TripMock.find = jest.fn();
  TripMock.findById = jest.fn();
  TripMock.findOne = jest.fn();
  TripMock.create = jest.fn();
  return TripMock;
});

jest.mock('../models/Match', () => {
  const MatchMock = jest.fn();
  MatchMock.find = jest.fn();
  MatchMock.findOne = jest.fn();
  MatchMock.create = jest.fn();
  return MatchMock;
});

jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../services/matchingService', () => ({
  findMatches: jest.fn().mockResolvedValue([]),
  getMatchesForTrip: jest.fn().mockResolvedValue([]),
  haversineDistance: jest.fn().mockReturnValue(500),
  calculateMatchScore: jest.fn().mockReturnValue(75),
}));

jest.mock('../services/costService', () => ({
  calculateFare: jest.fn().mockReturnValue(200),
  splitFare: jest.fn().mockReturnValue({ farePerPerson: 100, savingsPercentage: 50 }),
}));

const Trip = require('../models/Trip');
const User = require('../models/User');

// Build app
const app = express();
app.use(express.json());
app.use('/api/trips', require('../routes/trips'));

// Helper: generate a valid auth token and mock the user
const mockUser = { _id: 'user123', name: 'Test User', email: 'test@test.com' };
const validToken = jwt.sign({ id: 'user123' }, 'test-secret-key');
const authHeader = `Bearer ${validToken}`;

beforeEach(() => {
  jest.clearAllMocks();
  User.findById.mockResolvedValue(mockUser);
});

describe('GET /api/trips/search', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/trips/search');
    expect(res.status).toBe(401);
  });

  test('returns trips list with valid auth', async () => {
    Trip.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/trips/search')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.trips)).toBe(true);
  });
});

describe('GET /api/trips/my', () => {
  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/trips/my');
    expect(res.status).toBe(401);
  });

  test('returns user trips with valid auth', async () => {
    Trip.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([
        { _id: 'trip1', source: { address: 'A' }, destination: { address: 'B' } },
      ]),
    });

    const res = await request(app)
      .get('/api/trips/my')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
  });
});

describe('POST /api/trips', () => {
  const validTripBody = {
    source: { address: 'Station Road', lat: 30.3165, lng: 78.0322 },
    destination: { address: 'Clock Tower', lat: 30.3255, lng: 78.0412 },
    date: '2026-04-01',
    time: '09:00',
    seats: 2,
    vehicleType: 'auto',
    estimatedFare: 150,
  };

  test('returns 401 without auth', async () => {
    const res = await request(app).post('/api/trips').send(validTripBody);
    expect(res.status).toBe(401);
  });

  test('returns 400 when source address is missing', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', authHeader)
      .send({ ...validTripBody, source: { lat: 30.3165, lng: 78.0322 } });
    expect(res.status).toBe(400);
  });

  test('creates trip successfully with valid data', async () => {
    const createdTrip = { ...validTripBody, _id: 'trip123', user: mockUser, status: 'active' };
    Trip.create.mockResolvedValue({
      ...createdTrip,
      populate: jest.fn().mockResolvedValue(createdTrip),
    });

    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', authHeader)
      .send(validTripBody);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/trips/:tripId/connect', () => {
  test('returns 401 without auth', async () => {
    const res = await request(app).post('/api/trips/trip123/connect').send({});
    expect(res.status).toBe(401);
  });

  test('returns 404 when target trip not found', async () => {
    Trip.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post('/api/trips/nonexistent/connect')
      .set('Authorization', authHeader)
      .send({});
    expect(res.status).toBe(404);
  });

  test('returns 400 when connecting to own trip', async () => {
    Trip.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'trip123',
        user: { _id: 'user123', toString: () => 'user123' },
        status: 'active',
      }),
    });

    const res = await request(app)
      .post('/api/trips/trip123/connect')
      .set('Authorization', authHeader)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own trip/i);
  });

  test('returns 400 when user has no active trip', async () => {
    Trip.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'trip456',
        user: { _id: 'otheruser', toString: () => 'otheruser' },
        status: 'active',
      }),
    });
    // Trip.findOne().sort() chain returns null (no active trip for current user)
    Trip.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });

    const Match = require('../models/Match');
    Match.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/trips/trip456/connect')
      .set('Authorization', authHeader)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/active trip/i);
  });
});
