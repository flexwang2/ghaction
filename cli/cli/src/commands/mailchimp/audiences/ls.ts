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
    describe: 'List Mailchimp audiences',
    handler: async (
        argv: yargs.Arguments<MailchimpArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }

        // List all campaigns
        let audiences: api.Audience[];
        try {
            audiences = await argv.client.listAllAudiences();
        } catch (err) {
            log.error(
                'Unable to retrieve audiences from Mailchimp. Please make sure you have set a valid Mailchimp api key using the --apiKey flag.'
            );
            log.out(err);
            process.exit(1);
        }
        const rows = audiences.map((a): string[] => [
            a.name,
            a.id,
            a.stats.member_count.toString(),
        ]);
        term.table([['Name', 'ID', 'Member count'], ...rows], {
            hasBorder: true,
            contentHasMarkup: false,
            width: 120,
            fit: true,
        });
        log.info(`Found ${audiences.length} audiences`);
        process.exit(1);
    },
};
