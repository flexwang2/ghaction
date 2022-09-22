import * as api from 'src/mailchimp/api';
import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';
import { terminal as term } from 'terminal-kit';
import yargs from 'yargs';

interface LsCommandArguments extends MailchimpArguments {}

export const LsCommand: CommandModule<Arguments, LsCommandArguments> = {
    command: 'ls',
    describe: 'List Mailchimp campaigns',
    handler: async (
        argv: yargs.Arguments<MailchimpArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }

        // List all campaigns
        let campaigns: api.Campaign[];
        try {
            campaigns = await argv.client.listAllCampaigns();
        } catch (err) {
            log.error(
                'Unable to retrieve campaigns from Mailchimp. Please make sure you have set a valid Mailchimp api key using the --apiKey flag.'
            );
            log.out(err);
            process.exit(1);
        }
        const rows = campaigns.map((c): string[] => [
            c.settings.title,
            c.id,
            c.emails_sent.toString(),
        ]);
        term.table([['Title', 'ID', 'Email sent count'], ...rows], {
            hasBorder: true,
            contentHasMarkup: false,
            width: 120,
            fit: true,
        });
        log.info(`Found ${campaigns.length} campaigns`);
        process.exit(1);
    },
};
