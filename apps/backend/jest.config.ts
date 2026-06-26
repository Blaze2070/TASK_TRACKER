/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testTimeout: 20000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transformIgnorePatterns: ['node_modules/(?!expo-server-sdk|csv-stringify)/'],
};
