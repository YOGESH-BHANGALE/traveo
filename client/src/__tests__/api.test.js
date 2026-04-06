// Mock axios before importing api.js
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return { default: mockAxios, ...mockAxios };
});

import axios from 'axios';
import { authAPI, tripsAPI, ridesAPI, messagesAPI, usersAPI } from '@/lib/api';

describe('API client structure', () => {
  test('authAPI exposes register, login, getMe', () => {
    expect(typeof authAPI.register).toBe('function');
    expect(typeof authAPI.login).toBe('function');
    expect(typeof authAPI.getMe).toBe('function');
  });

  test('tripsAPI exposes all required methods', () => {
    ['create', 'search', 'getMyTrips', 'getTrip', 'getTripMatches', 'cancel', 'connect'].forEach((m) => {
      expect(typeof tripsAPI[m]).toBe('function');
    });
  });

  test('ridesAPI exposes all required methods', () => {
    ['accept', 'reject', 'getMyRides', 'getRide', 'start', 'complete', 'rate'].forEach((m) => {
      expect(typeof ridesAPI[m]).toBe('function');
    });
  });

  test('messagesAPI exposes send and getByRide', () => {
    expect(typeof messagesAPI.send).toBe('function');
    expect(typeof messagesAPI.getByRide).toBe('function');
  });

  test('usersAPI exposes profile methods', () => {
    ['getProfile', 'updateProfile', 'getPublicProfile', 'report'].forEach((m) => {
      expect(typeof usersAPI[m]).toBe('function');
    });
  });
});
