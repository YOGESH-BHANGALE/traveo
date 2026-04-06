process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');

// Mock DB connection so it never actually connects
jest.mock('../config/db', () => jest.fn());

// Mock passport
jest.mock('../config/passport', () => ({
  initialize: () => (req, res, next) => next(),
}));

// Mock push notifications
jest.mock('../services/notificationService', () => ({
  configurePush: jest.fn(),
}));

// Mock User model
jest.mock('../models/User', () => {
  const mockUser = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    prototype: { save: jest.fn() },
  };
  return mockUser;
});

const User = require('../models/User');

// Build a minimal express app with just the auth router
const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth'));

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 if email already exists', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing', email: 'test@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  test('returns 201 and token on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    const mockUser = {
      _id: 'newuser123',
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      rating: 5,
      totalTrips: 0,
      isVerified: false,
      toPublicJSON: jest.fn().mockReturnValue({
        _id: 'newuser123',
        name: 'Test User',
        email: 'test@example.com',
        rating: 5,
      }),
    };
    User.create.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('returns 401 for non-existent user', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});
