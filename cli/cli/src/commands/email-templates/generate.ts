import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { EmailTemplatesArguments } from 'src/commands/email-templates/arguments';
import { execfg } from 'src/lib/exec';
import { projectDir } from 'src/email-templates/resources';

interface GenerateCommandArguments extends EmailTemplatesArguments {}

export const GenerateCommand: CommandModule<
    Arguments,
    GenerateCommandArguments
> = {
    command: 'generate',
    aliases: ['gen'],
    describe: 'Generate compiled templates from local source',
    handler: async (): Promise<void> => {
        execfg('make gen', {
            cwd: projectDir().toString(),
        });
    },
};
