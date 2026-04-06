module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
  ],
  coverageReporters: ['text', 'lcov'],
};
