// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

export default {
    clearMocks: true,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/types/generated/**/*', '!<rootDir>/src/debug.ts'],
    coveragePathIgnorePatterns: ['\\\\node_modules\\\\', 'tests'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testMatch: ['<rootDir>/tests/**/*.(test|tests|spec|specs).+(ts|tsx|js)'],
    reporters: [
        'default',
        [
            'jest-sonar',
            {
                outputDirectory: '<rootDir>/coverage',
                outputName: 'test-report.xml',
                reportedFilePath: 'absolute'
            }
        ]
    ],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true
            }
        ]
    }
};
