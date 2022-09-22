import * as yargs from 'yargs';
import { Arguments } from 'src/arguments';
import { printSystemCaps } from 'src/system-capabilities/print';

// Command to dump system capabilities data
export const SystemShowCapsCommand: yargs.CommandModule<
    Arguments,
    Arguments
> = {
    command: 'system',
    describe: 'Show system capabilities',
    builder: (yargs): typeof yargs => {
        return yargs;
    },
    handler: async (): Promise<void> => {
        printSystemCaps();
    },
};
