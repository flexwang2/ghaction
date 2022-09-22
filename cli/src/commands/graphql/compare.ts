import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { buildSchema } from 'graphql';
import { diffLines } from 'diff';
import { formatSdl } from 'format-graphql';
import { promises as fs } from 'fs';
import { validateSchema } from 'graphql';

interface CompareArguments extends Arguments {
    left?: string;
    right?: string;
}

function validate(file: string, contents: string): boolean {
    const schema = buildSchema(contents);
    const results = validateSchema(schema);
    if (results && results.length > 0) {
        log.error(`${file} has errors:`);
        for (const error of results) {
            log.error(`- ${error.message}`);
        }
        return false;
    }
    return true;
}

export const CompareCommand: CommandModule<Arguments, CompareArguments> = {
    command: 'compare',
    aliases: ['c'],
    describe: 'Compare two graphql schemas and verify they are identical.',
    builder: (yargs) => {
        return yargs.options({
            left: {
                alias: 'l',
                type: 'string',
                description: 'First file to compare',
            },
            right: {
                alias: 'r',
                type: 'string',
                description: 'Second file to compare',
            },
        });
    },
    handler: async (args): Promise<void> => {
        if (!args.left || !args.right) {
            throw 'Must specify both left and right arguments.';
        }
        const left = (await fs.readFile(args.left)).toString();
        const right = (await fs.readFile(args.right)).toString();

        let successful = true;
        successful = successful && validate(args.left, left);
        successful = successful && validate(args.right, right);
        if (!successful) {
            throw 'Errors validating schemas.';
        }
        log.info('Schemas are valid');

        const leftPost = formatSdl(left);
        const rightPost = formatSdl(right);

        const diff = diffLines(leftPost, rightPost);

        let hasDiff = true;
        if (diff.length === 0) {
            hasDiff = false;
        } else if (diff.length === 1) {
            if (!diff[0]) {
                hasDiff = false;
            } else if (!diff[0].added && !diff[0].removed) {
                hasDiff = false;
            }
        }
        if (!hasDiff) {
            log.info('No diff!');
        } else {
            diff.forEach((part) => {
                if (!part) {
                    return;
                }
                let color: log.Color = 'white';
                let prefix = '';
                if (part.added) {
                    color = 'green';
                    prefix = '+';
                } else if (part.removed) {
                    color = 'red';
                    prefix = '-';
                }
                log.color(color, `${prefix}${part.value}`);
            });
        }
    },
};
