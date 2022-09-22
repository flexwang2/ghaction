import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { BuildCommand } from './build';
import { CommandModule } from 'yargs';

export const NeevaLibCommand: CommandModule<Arguments, Arguments> = {
    command: 'neeva-lib',
    aliases: ['nlib'],
    describe: 'neeva-lib commands',
    builder: (yargs) => {
        return yargs.command(BuildCommand).demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
