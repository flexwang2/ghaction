import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { BuildArchiveCommand } from './build-archive';
import { BuildSetupCommand } from './build-setup';
import { BumpVersionCommand } from './bump-version';
import { CommandModule } from 'yargs';
import { PrintVersionCommand } from './print-version';
import { SetVersionCommand } from './set-version';

export const ClientIosCommand: CommandModule<Arguments, Arguments> = {
    command: 'client-ios',
    aliases: ['ios'],
    describe: 'iOS client commands',
    builder: (yargs) => {
        return yargs
            .command(PrintVersionCommand)
            .command(BumpVersionCommand)
            .command(SetVersionCommand)
            .command(BuildArchiveCommand)
            .command(BuildSetupCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
