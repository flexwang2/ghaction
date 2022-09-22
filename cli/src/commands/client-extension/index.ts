import {} from './build';
import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { BuildCommand } from './build';
import { CommandModule } from 'yargs';
import { PrintVersionCommand } from './print-version';
import { PublishCommand } from './publish';

export const ClientExtensionCommand: CommandModule<Arguments, Arguments> = {
    command: 'client-extension',
    aliases: ['extension'],
    describe: 'extension client commands',
    builder: (yargs) => {
        return yargs
            .command(PrintVersionCommand)
            .command(BuildCommand)
            .command(PublishCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
