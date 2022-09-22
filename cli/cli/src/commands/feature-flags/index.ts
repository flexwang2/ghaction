import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { CreateFlagCommand } from './create-flag';
import { ListFlagsCommand } from './list-flags';
import { MergeFlagsCommand } from './merge-flags';

export const FeatureFlagCommand: CommandModule<Arguments, Arguments> = {
    command: 'feature-flag',
    aliases: ['ff'],
    describe: 'feature flag & experiment commands',
    builder: (yargs) => {
        return yargs
            .command(ListFlagsCommand)
            .command(CreateFlagCommand)
            .command(MergeFlagsCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
