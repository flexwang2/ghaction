import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { ListQueriesCommand } from './list-queries';
import { SetupCommand } from './setup';
import { StatusCommand } from './status';
import { SyncReportCommand } from './sync-report';

export const ModeCommand: CommandModule<Arguments, Arguments> = {
    command: 'mode',
    aliases: ['md'],
    describe: 'mode commands',
    builder: (yargs) => {
        return yargs
            .command(SetupCommand)
            .command(StatusCommand)
            .command(ListQueriesCommand)
            .command(SyncReportCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
