import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { BuildCommand } from './build';
import { CommandModule } from 'yargs';

export const NeevaLibDomCommand: CommandModule<Arguments, Arguments> = {
    command: 'neeva-lib-dom',
    aliases: ['nlibdom'],
    describe: 'neeva-lib-dom commands',
    builder: (yargs) => {
        return yargs.command(BuildCommand).demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
