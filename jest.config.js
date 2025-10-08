const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  testEnvironment: 'jest-environment-jsdom',
  
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
}

module.exports = createJestConfig(customJestConfig)