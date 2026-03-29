export default {
    displayName: 'apis',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/libraries/apis',
};
