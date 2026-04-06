process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../config/db', () => jest.fn());
jest.mock('../config/passport', () => ({ initialize: () => (req, res, next) => next() }));
jest.mock('../services/notificationService', () => ({ configurePush: jest.fn() }));

jest.mock('../models/Match', () => {
  const M = jest.fn();
  M.findById = jest.fn();
  M.findOne = jest.fn();
  return M;
});

jest.mock('../models/Ride', () => {
  const R = jest.fn();
  R.find = jest.fn();
  R.findById = jest.fn();
  R.create = jest.fn();
  return R;
});

jest.mock('../models/Trip', () => {
  const T = jest.fn();
  T.findById = jest.fn();
  T.findByIdAndUpdate = jest.fn();
  return T;
});

jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../services/costService', () => ({
  splitFare: jest.fn().mockReturnValue({ farePerPerson: 100, savingsPercentage: 50 }),
}));

const Match = require('../models/Match');
const Ride = require('../models/Ride');
const Trip = require('../models/Trip');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/rides', require('../routes/rides'));

const mockUser = { _id: 'user123', name: 'Test User' };
const validToken = jwt.sign({ id: 'user123' }, 'test-secret-key');
const authHeader = `Bearer ${validToken}`;

beforeEach(() => {
  jest.clearAllMocks();
  User.findById.mockResolvedValue(mockUser);
});

describe('GET /api/rides/my', () => {
  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/rides/my');
    expect(res.status).toBe(401);
  });

  test('returns rides array with valid auth', async () => {
    Ride.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/rides/my')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.rides)).toBe(true);
  });
});

describe('POST /api/rides/accept', () => {
  test('returns 401 without auth', async () => {
    const res = await request(app).post('/api/rides/accept').send({ matchId: 'match1' });
    expect(res.status).toBe(401);
  });

  test('returns 404 when match not found', async () => {
    // rideController calls Match.findById().populate('trip').populate('matchedTrip')
    // We need a chain that returns null after two .populate() calls
    let callCount = 0;
    const chain = {
      populate: jest.fn().mockImplementation(() => {
        callCount++;
        return callCount >= 2 ? Promise.resolve(null) : chain;
      }),
    };
    Match.findById.mockReturnValue(chain);

    const res = await request(app)
      .post('/api/rides/accept')
      .set('Authorization', authHeader)
      .send({ matchId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  test('returns 400 when match already accepted', async () => {
    let callCount = 0;
    const chain = {
      populate: jest.fn().mockImplementation(() => {
        callCount++;
        return callCount >= 2
          ? Promise.resolve({
              _id: 'match1',
              status: 'accepted',
              trip: { _id: 'trip1' },
              matchedTrip: { _id: 'trip2' },
            })
          : chain;
      }),
    };
    Match.findById.mockReturnValue(chain);

    const res = await request(app)
      .post('/api/rides/accept')
      .set('Authorization', authHeader)
      .send({ matchId: 'match1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already been accepted/i);
  });
});

describe('POST /api/rides/reject', () => {
  test('returns 404 when match not found', async () => {
    Match.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/rides/reject')
      .set('Authorization', authHeader)
      .send({ matchId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  test('rejects a pending match successfully', async () => {
    const mockMatch = {
      _id: 'match1',
      status: 'pending',
      save: jest.fn().mockResolvedValue(true),
    };
    Match.findById.mockResolvedValue(mockMatch);

    const res = await request(app)
      .post('/api/rides/reject')
      .set('Authorization', authHeader)
      .send({ matchId: 'match1' });
    expect(res.status).toBe(200);
    expect(mockMatch.status).toBe('rejected');
  });
});

describe('PUT /api/rides/:rideId/start', () => {
  test('returns 404 when ride not found', async () => {
    Ride.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/rides/nonexistent/start')
      .set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });

  test('starts a confirmed ride', async () => {
    const mockRide = {
      _id: 'ride1',
      status: 'confirmed',
      startedAt: null,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue({ _id: 'ride1', status: 'in_progress' }),
    };
    Ride.findById.mockResolvedValue(mockRide);

    const res = await request(app)
      .put('/api/rides/ride1/start')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(mockRide.status).toBe('in_progress');
    expect(mockRide.startedAt).toBeDefined();
  });
});

describe('PUT /api/rides/:rideId/complete', () => {
  test('returns 400 when ride already completed', async () => {
    Ride.findById.mockResolvedValue({ _id: 'ride1', status: 'completed' });

    const res = await request(app)
      .put('/api/rides/ride1/complete')
      .set('Authorization', authHeader);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already completed/i);
  });

  test('completes an in-progress ride', async () => {
    const mockRide = {
      _id: 'ride1',
      status: 'in_progress',
      users: [{ user: 'user123' }],
      trips: ['trip1'],
      completedAt: null,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue({ _id: 'ride1', status: 'completed' }),
    };
    Ride.findById.mockResolvedValue(mockRide);
    User.findByIdAndUpdate.mockResolvedValue({});
    Trip.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .put('/api/rides/ride1/complete')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(mockRide.status).toBe('completed');
  });
});
