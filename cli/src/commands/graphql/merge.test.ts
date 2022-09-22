import { join } from 'path';
import { merge } from './merge';

const outA = `type Query {
  "Comment on root."
  root: String
  b: String
  c: String
  a: A
}

type A {
  val: AEnum
}

enum AEnum {
  X
  Y
  Z
}

schema {
  query: Query
}
`;

const outB = `type Query {
  "Comment on root."
  root: String
  a: A
  c: String
}

type A {
  val: AEnum
}

enum AEnum {
  X
  Y
  Z
}

schema {
  query: Query
}
`;

const testDataDir = join(__dirname, 'testdata');

describe('commands/graphql/merge.ts', () => {
    it('merges from root with both a and b', async () => {
        const out = await merge(join(testDataDir, 'root.graphql'));
        expect(out).toBe(outA);
    });

    it('merges from root with just a', async () => {
        const out = await merge(join(testDataDir, 'root-only-a.graphql'));
        expect(out).toBe(outB);
    });
});
