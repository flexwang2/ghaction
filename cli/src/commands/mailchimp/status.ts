import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';
import yargs from 'yargs';

interface StatusCommandArguments extends MailchimpArguments {}

export const StatusCommand: CommandModule<Arguments, StatusCommandArguments> = {
    command: 'status',
    describe: 'Check Mailchimp auth status',
    handler: async (
        argv: yargs.Arguments<MailchimpArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }

        try {
            const { username } = await argv.client.whoami();
            log.success(`Authenticated with the Mailchimp API as ${username}`);
            process.exit(0);
        } catch (err) {
            log.error(
                'Unable to authenticate with the Mailchimp API. Please make sure you have set a valid Mailchimp api key using the --apiKey flag.'
            );
            process.exit(1);
        }
    },
};
