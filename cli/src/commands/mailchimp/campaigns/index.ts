import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { LsCommand } from 'src/commands/mailchimp/campaigns/ls';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';

export const CampaignsCommand: CommandModule<MailchimpArguments, Arguments> = {
    command: 'campaigns',
    aliases: ['c'],
    describe: 'mailchimp campaign commands',
    builder: (yargs) => {
        return yargs.command(LsCommand).demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
