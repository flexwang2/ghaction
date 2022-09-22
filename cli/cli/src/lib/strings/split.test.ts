import { safeSplit } from './split';

describe('strings/split', () => {
    describe('safeSplit', () => {
        const assertions = [
            [`git commit foo`, [`git`, `commit`, `foo`]],
            [
                `git commit -m "hello world"`,
                [`git`, `commit`, `-m`, `hello world`],
            ],
            [
                `git commit -m "hello 'my' world"`,
                [`git`, `commit`, `-m`, `hello 'my' world`],
            ],
            [
                `git commit -m 'hello "my" world'`,
                [`git`, `commit`, `-m`, `hello "my" world`],
            ],
            [`git add .`, [`git`, `add`, `.`]],
        ];

        assertions.forEach((assertion) => {
            it(assertion[0].toString(), () => {
                expect(safeSplit(assertion[0] as string)).toEqual(assertion[1]);
            });
        });
    });
});
