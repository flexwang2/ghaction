import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { CompareCommand } from './compare';
import { LintCommand } from './lint';
import { MergeCommand } from './merge';

export const GraphqlCommand: CommandModule<Arguments, Arguments> = {
    command: 'graphql',
    aliases: ['gql'],
    describe: 'graphql commands',
    builder: (yargs) => {
        return yargs
            .command(CompareCommand)
            .command(LintCommand)
            .command(MergeCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
