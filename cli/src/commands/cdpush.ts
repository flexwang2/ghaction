/* eslint-disable no-console */
import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { getS3Client, uploadFileToS3URL } from 'src/s3/s3-client';
import { terminal as term } from 'terminal-kit';
import globby from 'globby';
import process from 'process';

interface CDPushCommandArguments extends Arguments {
    s3_prefix: string;
    aws_region: string;
    commit_hash: string;
    data_files: string[];
}

export const CDPushCommand: CommandModule<Arguments, CDPushCommandArguments> = {
    command: 'cdpush',
    describe: 'Push data under $NEEVA_REPO/serving/cdpush/data to a s3 prefix',
    builder: (yargs) => {
        return yargs.options({
            s3_prefix: {
                type: 'string',
                description: 'The s3 prefix where we push the data',
                demandOption: true,
            },
            aws_region: {
                type: 'string',
                alias: ['r'],
                description: 'AWS region of upload bucket',
                demandOption: true,
            },
            data_files: {
                type: 'array',
                description:
                    'Files under serving/cdpush/data that will be pushed. ' +
                    'If not set, all files under $NEEVA_REPO/serving/cdpush/data will be pushed',
                default: [],
            },
            commit_hash: {
                type: 'string',
                description:
                    'The commit hash when the current version of data is created/updated',
                default: '',
            },
        });
    },
    handler: async (args): Promise<void> => {
        try {
            let s3_prefix = args.s3_prefix;
            if (!s3_prefix.startsWith('s3://')) {
                throw new Error('Invalid --s3_prefix:' + s3_prefix);
            }
            let data_files = args.data_files;
            if (data_files.length === 0) {
                log.info(
                    `No --data_files specified, will push all files under ${process.cwd()}/serving/cdpush/data`
                );
                data_files = await globby(`serving/cdpush/data/**/*`);
            }
            for (const file of data_files) {
                if (!file.startsWith('serving/cdpush/data/')) {
                    throw new Error(
                        `Invalid data_file: ${file}, file path must start with serving/cdpush/data/`
                    );
                }
            }
            if (args.commit_hash.length === 0) {
                log.info('No --commit_hash specified.');
            }
            const client = getS3Client({ region: args.aws_region });
            if (!s3_prefix.endsWith('/')) {
                s3_prefix += '/';
            }
            const escapedTS = escapeTimestamp();
            let body = ""
            for (const file of data_files) {
                body += `CDPushed ${file} to s3://neeva-cdpush-us-east-1/cdpush\n`
                const subdir =
                    'cdpush/' + file.replace('serving/cdpush/data/', '');
                let object = '/v0.' + escapedTS;
                if (args.commit_hash.length > 0) {
                    object += '.commit=' + args.commit_hash;
                }
                const s3_dest = s3_prefix + subdir + object;
                await uploadFileToS3URL(client, s3_dest, file);
                term.brightGreen('✅ pushed ')
                    .defaultColor(`${process.cwd()}/${file}`)
                    .brightGreen(' to ')
                    .defaultColor(s3_dest)
                    .defaultColor('\n');
            }
        } catch (error) {
            term.red('🙃 failed to cdpush data\n');
            console.error(error);
            process.exit(1);
        }
    },
};

function escapeTimestamp(): string {
    return new Date().toISOString().replace(/:/g, '-');
}
