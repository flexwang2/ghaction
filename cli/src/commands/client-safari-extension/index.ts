import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { BuildArchiveCommand } from './build-archive';
// import { BuildSetupCommand } from './build-setup';
import { BumpVersionCommand } from './bump-version';
import { CommandModule } from 'yargs';
import { PrintVersionCommand } from './print-version';

export const ClientSafariExtensionCommand: CommandModule<
    Arguments,
    Arguments
> = {
    command: 'client-safari-extension',
    aliases: ['safari-ext'],
    describe: 'Safari extension commands',
    builder: (yargs) => {
        return yargs
            .command(PrintVersionCommand)
            .command(BumpVersionCommand)
            .command(BuildArchiveCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
