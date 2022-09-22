import {
    convertToCamelCase,
    convertToDashCase,
    convertToPascalCase,
    convertToSnakeCase,
    fixedLen,
    stripQuotes,
} from './format';

describe('strings/format.ts', () => {
    describe('fixedLen', () => {
        const expectations = [
            ['abc', 3, 'abc'],
            ['abcdef', 3, 'abc'],
            ['a', 3, 'a  '],
        ];

        expectations.forEach((ex: any[]) => {
            const value = ex[0];
            const len = ex[1];
            const expected = ex[2];

            it(`(${value}, ${len}) should be "${expected}"`, () => {
                const result = fixedLen(value, len);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('stripQuotes', () => {
        const expectations = [
            [`abc`, `abc`],
            [`"abc`, `"abc`],
            [`abc"`, `abc"`],
            [`'abc"`, `'abc"`],
            [`"abc'`, `"abc'`],
            [`"abc"`, `abc`],
            [`'abc'`, `abc`],
        ];

        expectations.forEach((ex: any[]) => {
            const value = ex[0];
            const expected = ex[1];

            it(`(${value}) should be ${expected}`, () => {
                const result = stripQuotes(value);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('convertToPascalCase', () => {
        const expectations: { [key: string]: string } = {
            h: 'H',
            'hello-world': 'HelloWorld',
            hello_world: 'HelloWorld',
            'hello--world': 'HelloWorld',
            'hello_-world': 'HelloWorld',
            'hello-World': 'HelloWorld',
            helloWorld: 'HelloWorld',
            HelloWorld: 'HelloWorld',
            '-helloWorld-': 'HelloWorld',
        };

        Object.keys(expectations).forEach((key: string) => {
            const input = key;
            const expected = expectations[key];

            it(`should convert ${input} to ${expected}`, () => {
                const result = convertToPascalCase(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('convertToCamelCase', () => {
        const expectations: { [key: string]: string } = {
            '': '',
            h: 'h',
            'hello-world': 'helloWorld',
            hello_world: 'helloWorld',
            'hello--world': 'helloWorld',
            'hello_-world': 'helloWorld',
            'hello-World': 'helloWorld',
            helloWorld: 'helloWorld',
            HelloWorld: 'helloWorld',
            '-helloWorld-': 'helloWorld',
        };

        Object.keys(expectations).forEach((key: string) => {
            const input = key;
            const expected = expectations[key];

            it(`should convert ${input} to ${expected}`, () => {
                const result = convertToCamelCase(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('convertToDashCase', () => {
        const expectations: { [key: string]: string } = {
            h: 'h',
            helloWorld: 'hello-world',
            HelloWorld: 'hello-world',
            helloworld: 'helloworld',
            '-hi-byeWorld': 'hi-bye-world',
            'hello-world': 'hello-world',
            'hello -world': 'hello-world',
        };

        Object.keys(expectations).forEach((key: string) => {
            const input = key;
            const expected = expectations[key];

            it(`should convert ${input} to ${expected}`, () => {
                const result = convertToDashCase(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('convertToSnakeCase', () => {
        const expectations: { [key: string]: string } = {
            h: 'h',
            helloWorld: 'hello_world',
            HelloWorld: 'hello_world',
            helloworld: 'helloworld',
            '-hi-byeWorld': 'hi_bye_world',
            'hello-world': 'hello_world',
        };

        Object.keys(expectations).forEach((key: string) => {
            const input = key;
            const expected = expectations[key];

            it(`should convert ${input} to ${expected}`, () => {
                const result = convertToSnakeCase(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('fixedLen', () => {
        const expectations = [
            ['abc', 3, 'abc'],
            ['abcdef', 3, 'abc'],
            ['a', 3, 'a  '],
        ];

        expectations.forEach((ex: any[]) => {
            const value = ex[0];
            const len = ex[1];
            const expected = ex[2];

            it(`(${value}, ${len}) should be "${expected}"`, () => {
                const result = fixedLen(value, len);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('stripQuotes', () => {
        const expectations = [
            [`abc`, `abc`],
            [`"abc`, `"abc`],
            [`abc"`, `abc"`],
            [`'abc"`, `'abc"`],
            [`"abc'`, `"abc'`],
            [`"abc"`, `abc`],
            [`'abc'`, `abc`],
        ];

        expectations.forEach((ex: any[]) => {
            const value = ex[0];
            const expected = ex[1];

            it(`(${value}) should be ${expected}`, () => {
                const result = stripQuotes(value);
                expect(result).toEqual(expected);
            });
        });
    });
});
