const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
});
