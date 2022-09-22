import * as log from 'src/lib/log';
import * as yargs from 'yargs';
import { Arguments } from '../../arguments';
import { DatabricksArguments } from './arguments';
import { StatCommand } from './stat';
import { newClient } from './client';

export const DatabricksCommand: yargs.CommandModule<
    DatabricksArguments,
    Arguments
> = {
    command: 'databricks',
    aliases: ['db'],
    describe: 'Manage databricks through the API',
    builder: (yargs) => {
        return yargs
            .options({
                instance: {
                    type: 'string',
                    default: undefined,
                    description: 'ID of the databricks cluster.',
                },
                token: {
                    type: 'string',
                    default: undefined,
                    description: 'ID of the databricks cluster.',
                },
                prod: {
                    type: 'boolean',
                    alias: ['p'],
                    default: false,
                    description: 'Use the production cluster information.',
                },
                client: {
                    default: undefined,
                },
            })
            .middleware((argv: yargs.Arguments<DatabricksArguments>): void => {
                argv.client = newClient(argv);
            })
            .command(StatCommand)
            .demandCommand();
    },
    handler: (): void => {
        log.error('No command specified!');
    },
};
