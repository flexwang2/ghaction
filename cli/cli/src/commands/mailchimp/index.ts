import * as log from 'src/lib/log';
import * as yargs from 'yargs';
import { Arguments } from 'src/arguments';
import { AudiencesCommand } from 'src/commands/mailchimp/audiences';
import { CampaignsCommand } from 'src/commands/mailchimp/campaigns';
import { CommandModule } from 'yargs';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';
import { MailchimpClient } from 'src/mailchimp/client';
import { StatusCommand } from 'src/commands/mailchimp/status';
import { TemplatesCommand } from 'src/commands/mailchimp/templates';

export const MailchimpCommand: CommandModule<MailchimpArguments, Arguments> = {
    command: 'mailchimp',
    aliases: ['mc'],
    describe: 'Mailchimp commands',
    builder: (yargs) => {
        return yargs
            .options({
                apiKey: {
                    type: 'string',
                    default: process.env.MAILCHIMP_API_KEY,
                    description:
                        'Mailchimp API key. May also be set with environment variable MAILCHIMP_API_KEY',
                },
                client: {
                    default: undefined,
                },
                staging: {
                    default: true,
                    type: 'boolean',
                    description:
                        'Staging mode, which prevents modifying live production templates',
                },
            })
            .demandOption('apiKey')
            .middleware((argv: yargs.Arguments<MailchimpArguments>): void => {
                if (!argv.apiKey) {
                    throw 'Missing apiKey';
                }
                argv.client = new MailchimpClient(argv.apiKey);
            })
            .command(StatusCommand)
            .command(TemplatesCommand)
            .command(CampaignsCommand)
            .command(AudiencesCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
