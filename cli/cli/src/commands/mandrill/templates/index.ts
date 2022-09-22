import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { InfoCommand } from 'src/commands/mandrill/templates/info';
import { LsCommand } from 'src/commands/mandrill/templates/ls';
import { MandrillArguments } from 'src/commands/mandrill/arguments';
import { PreviewCommand } from 'src/commands/mandrill/templates/preview';
import { SendCommand } from 'src/commands/mandrill/templates/send';
import { SyncCommand } from 'src/commands/mandrill/templates/sync';

export const TemplatesCommand: CommandModule<MandrillArguments, Arguments> = {
    command: 'templates',
    aliases: ['t'],
    describe: 'mandrill template commands',
    builder: (yargs) => {
        return yargs
            .command(InfoCommand)
            .command(LsCommand)
            .command(PreviewCommand)
            .command(SendCommand)
            .command(SyncCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
