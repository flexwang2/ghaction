module.exports = {
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '^src/(.*)': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test))\\.ts?$',
    testPathIgnorePatterns: ['/node_modules/'],
    collectCoverageFrom: ['src/**/*.{js,jsx,mjs}'],
    testEnvironment: 'node',
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
