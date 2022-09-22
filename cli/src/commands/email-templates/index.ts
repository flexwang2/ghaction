import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { EmailTemplatesArguments } from 'src/commands/email-templates/arguments';
import { GenerateCommand } from './generate';

export const EmailTemplatesCommand: CommandModule<
    EmailTemplatesArguments,
    Arguments
> = {
    command: 'email-templates',
    aliases: ['email'],
    describe: 'email template commands',
    builder: (yargs) => {
        return yargs.command(GenerateCommand).demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
