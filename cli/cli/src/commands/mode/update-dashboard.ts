import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { getClientWithAuth } from 'src/mode/auth';
import { mustHaveModeAccess } from 'src/mode/cli-helpers';

export const ListQueriesCommand: CommandModule<Arguments, Arguments> = {
    command: 'list-queries',
    describe: 'List queries that are part of a report',
    handler: async (): Promise<void> => {
        await mustHaveModeAccess();
        const client = await getClientWithAuth();
        const queries = await client.getReportQueries('d84a6e6a89a8');

        for (const q of queries) {
            log.highlight(`- ${q.name}`);
        }
    },
};
