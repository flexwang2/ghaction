import * as log from 'src/lib/log';
import * as yargs from 'yargs';
import { Arguments } from 'src/arguments';

const RunHTTPDCommand: yargs.CommandModule<Arguments, Arguments> = {
    command: 'httpd',
    describe: 'Run HTTPD locally. Requires the stack to be running.',
    builder: (yargs): typeof yargs => {
        return yargs;
    },
    handler: async (): Promise<void> => {
        log.error('Not implemented');
    },
};

export const KubeCommand: yargs.CommandModule<Arguments, Arguments> = {
    command: 'kube',
    aliases: ['k'],
    describe: 'Run commands in the kube environment',
    builder: (yargs): typeof yargs => {
        return yargs.command(RunHTTPDCommand).demandCommand();
    },
    handler: (): void => {
        log.error('No command specified!');
    },
};
