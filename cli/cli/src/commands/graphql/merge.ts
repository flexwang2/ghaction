import * as log from 'src/lib/log';
import * as path from 'path';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { promises as fs } from 'fs';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

interface MergeArguments extends Arguments {
    root?: string;
    output?: string;
}

async function buildGraph(root: string): Promise<Map<string, string>> {
    const s = /(^|\n)# include "([^"]*)"/g;
    const toLoad: string[] = [path.resolve('.', root)];
    const loaded = new Map<string, string>();
    while (toLoad.length > 0) {
        const loading = toLoad.pop();
        if (!loading) {
            continue;
        }
        log.debug(`loading from file: ${loading}`);
        if (loaded.has(loading)) {
            log.debug(`- file ${loading} already loaded: skipping`);
            continue;
        }
        const contents = (await fs.readFile(loading)).toString();
        log.debug(`- contents read`);
        const filesToLoad = contents.matchAll(s);
        for (const m of filesToLoad) {
            const relativeF: string = m[2];
            const absoluteF = path.resolve(path.dirname(loading), relativeF);
            log.debug(`- adding dependency ${absoluteF}`);
            toLoad.push(absoluteF);
        }

        loaded.set(loading, contents);
    }
    return loaded;
}

export async function merge(root?: string): Promise<string> {
    if (!root) {
        throw 'No root file specified; use --root="" to specify a valid file.';
    }
    log.debug(`Looking for graphql root file: ${root}`);
    const contents = await buildGraph(root);
    const all: string[] = [];
    contents.forEach((v): void => {
        all.push(v);
    });
    log.debug('Finished reading merged schema.');
    const mergedDefs = mergeTypeDefs(all);
    log.debug('Finished reading merged schema.');

    return print(mergedDefs);
}

export const MergeCommand: CommandModule<Arguments, MergeArguments> = {
    command: 'merge',
    aliases: ['m'],
    describe: 'Merge .graphql files into a single graphql file',
    builder: (yargs) => {
        return yargs.options({
            root: {
                alias: 'r',
                type: 'string',
                description: 'Root grapqhl file to begin with.',
            },
            output: {
                type: 'string',
                alias: 'o',
                description:
                    'File to output to. Will be overwritten if it already exists.',
            },
        });
    },
    handler: async (args): Promise<void> => {
        const mergedSchema = await merge(args.root);
        if (args.output) {
            log.debug(`Writing merged schema to ${args.output}`);
            await fs.writeFile(args.output, mergedSchema);
        } else {
            log.out(mergedSchema);
        }
    },
};
