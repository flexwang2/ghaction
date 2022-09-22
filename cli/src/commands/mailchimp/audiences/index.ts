import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { LsCommand } from 'src/commands/mailchimp/audiences/ls';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';

export const AudiencesCommand: CommandModule<MailchimpArguments, Arguments> = {
    command: 'audiences',
    aliases: ['a'],
    describe: 'mailchimp audience commands',
    builder: (yargs) => {
        return yargs.command(LsCommand).demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
