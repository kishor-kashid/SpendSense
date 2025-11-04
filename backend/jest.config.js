module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/database.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Increase default timeout for slow integration tests
  testTimeout: 30000
};

