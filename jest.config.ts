import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@domain$': '<rootDir>/src/domain',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application$': '<rootDir>/src/application',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@adapters$': '<rootDir>/src/adapters',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1'
  }
};

export default config;
