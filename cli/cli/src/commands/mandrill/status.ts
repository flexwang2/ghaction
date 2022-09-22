import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MandrillArguments } from './arguments';
import yargs from 'yargs';

interface StatusCommandArguments extends MandrillArguments {}

export const StatusCommand: CommandModule<Arguments, StatusCommandArguments> = {
    command: 'status',
    describe: 'Check Mandrill auth status',
    handler: async (
        argv: yargs.Arguments<MandrillArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }

        try {
            await argv.client.whoami();
            log.success('Authenticated with the Mandrill API');
            process.exit(0);
        } catch (err) {
            log.error(
                'Unable to authenticate with the Mandrill API. Please make sure you have set a valid Mandrill api key using the --apiKey flag.'
            );
            process.exit(1);
        }
    },
};
