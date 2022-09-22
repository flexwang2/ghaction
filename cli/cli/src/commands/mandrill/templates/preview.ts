import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MandrillArguments } from 'src/commands/mandrill/arguments';
import yargs from 'yargs';

interface PreviewCommandArguments extends MandrillArguments {
    // Automatically open the system default web browser
    openBrowser?: boolean;
}

export const PreviewCommand: CommandModule<
    Arguments,
    PreviewCommandArguments
> = {
    command: 'preview',
    aliases: ['p'],
    describe: 'Preview rendered templates in a browser',
    builder: (yargs) => {
        return yargs.positional('openBrowser', {
            describe:
                'Automatically launch a browser after starting preview server',
            type: 'boolean',
            default: false,
        });
    },
    handler: async (argv: yargs.Arguments<PreviewCommandArguments>) => {
        if (!argv.client) {
            throw 'Missing client';
        }

        log.info('TODO: implement preview command');
    },
};
