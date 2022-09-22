/* eslint-disable no-console */
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { terminal as term } from 'terminal-kit';
import { writeFeatureFlags } from 'src/feature-flags/merged-feature-flags';

interface MergeFlagsCommandArguments extends Arguments {
    path: string;
    author?: string;
    aws_region?: string;
    force_write: boolean;
    copy_gc_path?: string;
}

export const MergeFlagsCommand: CommandModule<
    Arguments,
    MergeFlagsCommandArguments
> = {
    command: 'merge',
    aliases: ['m'],
    describe: 'Merge all feature flags into one bundle file',
    builder: (yargs) => {
        return yargs.options({
            path: {
                type: 'string',
                alias: ['p'],
                description:
                    'Directory path for the bundle file, either local or S3.',
                demandOption: true,
            },
            author: {
                type: 'string',
                alias: ['a'],
                description: 'Author of the upload',
                default: process.env.NEEVA_USER,
            },
            aws_region: {
                type: 'string',
                alias: ['r'],
                description: 'AWS region of upload bucket',
                default: process.env.AWS_DEFAULT_REGION,
            },
            force_write: {
                type: 'boolean',
                alias: ['f'],
                description: 'Skip diff review and force write bundle file',
                default: false,
            },
            copy_gc_path: {
                type: 'string',
                alias: ['gp'],
                description:
                    'Directory path for archived bundle files (least recent files are garbage collected). Use this flag to preserve archived files to gc folder, otherwise they will be deleted permanently once outdated.',
            },
        });
    },
    handler: async (args): Promise<void> => {
        try {
            if (!args.author) {
                throw new Error(
                    'Empty author name: either pass in author using flag --a or set env variable NEEVA_USER.'
                );
            }
            const filePath = await writeFeatureFlags(
                args.path,
                args.author,
                args.aws_region,
                args.force_write,
                args.copy_gc_path
            );
            term.brightGreen('✅ wrote to file: ')
                .gray(filePath)
                .defaultColor('\n');
        } catch (error) {
            term.red('🤬 failed to merge feature flags\n');
            console.error(error);
            console.error(error.stack);
            process.exit(1);
        }
    },
};
