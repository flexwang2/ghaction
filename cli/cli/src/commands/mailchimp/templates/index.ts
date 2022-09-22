import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { LsCommand } from 'src/commands/mailchimp/templates/ls';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';
import { SyncCommand } from 'src/commands/mailchimp/templates/sync';

export const TemplatesCommand: CommandModule<MailchimpArguments, Arguments> = {
    command: 'templates',
    aliases: ['t'],
    describe: 'mailchimp template commands',
    builder: (yargs) => {
        return yargs.command(LsCommand).command(SyncCommand).demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
