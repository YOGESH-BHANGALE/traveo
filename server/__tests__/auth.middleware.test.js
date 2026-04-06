const jwt = require('jsonwebtoken');

// Set JWT_SECRET before requiring middleware
process.env.JWT_SECRET = 'test-secret-key';

const { generateToken } = require('../middleware/auth');

// Mock User model to avoid DB connection
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');
const { protect } = require('../middleware/auth');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    test('generates a valid JWT token', () => {
      const token = generateToken('user123');
      const decoded = jwt.verify(token, 'test-secret-key');
      expect(decoded.id).toBe('user123');
    });

    test('token expires in 7 days by default', () => {
      const token = generateToken('user123');
      const decoded = jwt.decode(token);
      const sevenDaysFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      expect(decoded.exp).toBeLessThanOrEqual(sevenDaysFromNow + 5);
      expect(decoded.exp).toBeGreaterThan(sevenDaysFromNow - 5);
    });
  });

  describe('protect middleware', () => {
    test('rejects request with no token', async () => {
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects when user not found in DB', async () => {
      const token = generateToken('nonexistent123');
      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(null);

      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next() and sets req.user for valid token', async () => {
      const mockUser = { _id: 'user123', name: 'Test User', email: 'test@test.com' };
      const token = generateToken('user123');
      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
    });
  });
});
