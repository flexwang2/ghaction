import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { getClientWithAuth } from 'src/mode/auth';
import { mustHaveModeAccess } from 'src/mode/cli-helpers';

export const ListQueriesCommand: CommandModule<Arguments, Arguments> = {
    command: 'list-queries <report>',
    describe: 'List queries that are part of a report',
    handler: async (args): Promise<void> => {
        await mustHaveModeAccess();
        const client = await getClientWithAuth();
        const queries = await client.getReportQueries(
            (args.report as string) ?? ''
        );

        for (const q of queries) {
            log.highlight(`- ${q.name} (${q.token})`);
        }
    },
};
