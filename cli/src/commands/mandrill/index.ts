import * as log from 'src/lib/log';
import * as yargs from 'yargs';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MandrillArguments } from 'src/commands/mandrill/arguments';
import { MandrillClient } from 'src/mandrill/client';
import { StatusCommand } from 'src/commands/mandrill/status';
import { TemplatesCommand } from 'src/commands/mandrill/templates';

export const MandrillCommand: CommandModule<MandrillArguments, Arguments> = {
    command: 'mandrill',
    aliases: ['mdl'],
    describe: 'mandrill commands',
    builder: (yargs) => {
        return yargs
            .options({
                apiKey: {
                    type: 'string',
                    default: process.env.MANDRILL_API_KEY,
                    description:
                        'Mandrill API key. May also be set with environment variable MANDRILL_API_KEY',
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
            .middleware((argv: yargs.Arguments<MandrillArguments>): void => {
                if (!argv.apiKey) {
                    throw 'Missing apiKey';
                }
                argv.client = new MandrillClient(argv.apiKey);
            })
            .command(StatusCommand)
            .command(TemplatesCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
