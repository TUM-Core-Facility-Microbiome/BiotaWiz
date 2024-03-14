/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: ['<rootDir>/src'],
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'text', 'lcov'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/api/*.ts', 'src/utils/*.ts'],
};
