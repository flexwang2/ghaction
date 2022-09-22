import { lint } from './lint';
import { print } from 'graphql';
import gql from 'graphql-tag';

describe('commands/graphql/merge.ts', () => {
    it('no lint errors for valid file', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    name: String
                    a: A
                    b: B
                }

                type Mutation {
                    done(input: MyInput): String
                }

                input MyInput {
                    x: X
                }

                input X {
                    point: String
                    line: String
                }

                type A {
                    b: B
                }

                type B {
                    x: String
                    y: String
                }
            `),
            {}
        );
        expect(out).toStrictEqual([]);
    });

    it('lint error for reflexively recursive field', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    a: A
                }

                type A {
                    a: A
                }
            `),
            {}
        );
        expect(out).toStrictEqual([
            'Recursive type found: "A", cycle in path: [A].a[A]',
        ]);
    });

    it('lint error for complex recursive field', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    a: A
                }

                type A {
                    x: B
                }

                type B {
                    y: A
                }
            `),
            {}
        );
        expect(out).toStrictEqual([
            'Recursive type found: "B", cycle in path: [A].x[B].y[A]',
        ]);
    });

    it('lint error for list recursive field', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    a: [A]
                }

                type A {
                    x: B
                }

                type B {
                    y: A
                }
            `),
            {}
        );
        expect(out).toStrictEqual([
            'Recursive type found: "B", cycle in path: [A].x[B].y[A]',
        ]);
    });

    it('lint error for mutation recursive field', async () => {
        const out = lint(
            print(gql`
                schema {
                    mutation: Mutation
                }

                type Mutation {
                    a: A
                }

                type A {
                    x: B
                }

                type B {
                    y: A
                }
            `),
            {}
        );
        expect(out).toStrictEqual([
            'Recursive type found: "B", cycle in path: [A].x[B].y[A]',
        ]);
    });

    it('lint error for input recursive field', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    a(q: X): String
                }

                type A {
                    value: String
                }

                input X {
                    y: Y
                }

                input Y {
                    x: X
                }
            `),
            {}
        );

        expect(out).toStrictEqual([
            'Recursive type found: "Y", cycle in path: [X].y[Y].x[X]',
        ]);
    });

    it('lint error for example from the wild recursive field', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    re: RichEntity
                }

                type RichEntity {
                    richEntity: RichEntityData
                }

                type RichEntityData {
                    relatedSearches: [RichEntityData!]
                }
            `),
            {}
        );
        expect(out).toStrictEqual([
            'Recursive type found: "RichEntityData", cycle in path: [RichEntityData].relatedSearches[RichEntityData]',
        ]);
    });

    it('lint error for multiple recursive types', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    a(q: X): A
                }

                type A {
                    x: B
                }

                type B {
                    y: A
                }

                input X {
                    y: Y
                }

                input Y {
                    x: X
                }
            `),
            {}
        );

        expect(out).toStrictEqual(
            expect.arrayContaining([
                'Recursive type found: "B", cycle in path: [A].x[B].y[A]',
                'Recursive type found: "Y", cycle in path: [X].y[Y].x[X]',
            ])
        );
    });

    it('respects allowed recursive types', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    a(q: X): A
                }

                type A {
                    x: B
                }

                type B {
                    y: A
                }

                input X {
                    y: Y
                }

                input Y {
                    x: X
                }
            `),
            {
                allowedRecursiveTypes: ['B'],
            }
        );
        expect(out).toStrictEqual([
            'Recursive type found: "Y", cycle in path: [X].y[Y].x[X]',
        ]);
    });

    it('lint error following unions', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    c: C
                }

                union C = A | B

                type A {
                    b: B
                }

                type B {
                    a: A
                }
            `),
            {}
        );

        expect(out).toStrictEqual([
            'Recursive type found: "B", cycle in path: [A].b[B].a[A]',
        ]);
    });

    it('lint error following lists/union/nulls', async () => {
        const out = lint(
            print(gql`
                schema {
                    query: Query
                }

                type Query {
                    c: [C!]!
                }

                union C = A | B

                type A {
                    b: B
                }

                type B {
                    a: A
                }
            `),
            {}
        );

        expect(out).toStrictEqual([
            'Recursive type found: "B", cycle in path: [A].b[B].a[A]',
        ]);
    });
});
