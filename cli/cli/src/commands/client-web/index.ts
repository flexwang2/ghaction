import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { BuildCommand } from './build';
import { BumpVersionCommand } from './bump-version';
import { CommandModule } from 'yargs';
import { PrintVersionCommand } from './print-version';
import { SetVersionCommand } from './set-version';

export const ClientWebCommand: CommandModule<Arguments, Arguments> = {
    command: 'client-web',
    aliases: ['web'],
    describe: 'web client commands',
    builder: (yargs) => {
        return yargs
            .command(PrintVersionCommand)
            .command(BumpVersionCommand)
            .command(SetVersionCommand)
            .command(BuildCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
