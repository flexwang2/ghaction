import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { DatabricksArguments } from './arguments';
import yargs from 'yargs';

interface ClusterStatCommandArguments extends DatabricksArguments {}

export const StatCommand: CommandModule<
    Arguments,
    ClusterStatCommandArguments
> = {
    command: 'cluster-stat',
    aliases: ['cs'],
    describe:
        'Cluster statistics. This validates that the instance ' +
        'is reachable, and provides some basic information.',
    handler: async (
        argv: yargs.Arguments<DatabricksArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }
        log.out(await argv.client.clusterStats());
    },
};
