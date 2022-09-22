import * as fs from 'src/lib/fs';
import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { Query } from 'src/mode/api-client/schemas';
import { getClientWithAuth } from 'src/mode/auth';
import { mustHaveModeAccess } from 'src/mode/cli-helpers';
import { piiDataSourceID } from 'src/mode/constants';

export const SyncReportCommand: CommandModule<Arguments, Arguments> = {
    command: 'sync-report <dir>',
    describe: 'Synchronize a directory with queries to a mode report',
    handler: async (args): Promise<void> => {
        await mustHaveModeAccess();
        const client = await getClientWithAuth();

        // Validate command args
        if (!args.dir) {
            log.error('No directory specified!');
            process.exit(1);
        }

        // Load config
        const configDir = fs.Directory.fromPath(
            args.dir as string,
            args.cwd ?? ''
        );
        const configFile = configDir.file('mode.json');
        if (!configFile.exists) {
            log.error(`No mode.json found in ${configDir.path}`);
            process.exit(1);
        }
        const config = JSON.parse(configFile.read());

        // Start sync
        log.highlight(
            `Synchronizing report ${config.report} loaded from ${configDir.path}...`
        );

        // Build list of queries. Each query must be contained in a subdirectory, in a file
        // named after the directory. For example, GR-899/GR-899.sql.
        const queryFiles: fs.File[] = [];
        for (const dir of configDir.subdirs) {
            const queryFile = dir.file(`${dir.basename}.sql`);
            if (queryFile.exists()) {
                queryFiles.push(queryFile);
            } else {
                log.warn('Skipping directory without query file:', dir.path);
            }
        }

        // Get list of queries in report
        const queries = await client.getReportQueries(config.report);

        // Drop queries not included in query files
        for (const q of queries) {
            if (findQueryInQueryFiles(q.name, queryFiles) === null) {
                log.info(`Dropping query ${q.name}`);
                await client.deleteQueryFromReport(q.token, config.report);
            }
        }

        // Add or update queries
        for (const qf of queryFiles) {
            const name = normalizeQueryNameFromFile(qf);
            const query = findQuery(name, queries);
            // Need to add query...
            if (!query) {
                log.info(`Adding query ${name} [${qf.path}]`);
                await client.addQueryToReport(
                    {
                        raw_query: qf.read(),
                        name,
                        data_source_id: piiDataSourceID,
                    },
                    config.report
                );
                continue;
            }
            // Check if we need to update the query...
            if (query.raw_query === qf.read()) {
                log.info(
                    `Skipping query ${name}; no sql changes. [${qf.path}]`
                );
                continue;
            }
            // Need to update query...
            log.info(`Updating query ${name} [${qf.path}]`);
            await client.updateQueryInReport(
                query.token,
                {
                    raw_query: qf.read(),
                    name,
                    data_source_id: piiDataSourceID,
                },
                config.report
            );
        }
    },
};

function normalizeQueryNameFromFile(file: fs.File): string {
    return file.basename;
}

function findQueryInQueryFiles(
    queryName: string,
    queryFiles: fs.File[]
): fs.File | null {
    for (const file of queryFiles) {
        if (normalizeQueryNameFromFile(file) === queryName) {
            return file;
        }
    }
    return null;
}

function findQuery(name: string, queries: Query[]): Query | null {
    for (const q of queries) {
        if (q.name === name) {
            return q;
        }
    }
    return null;
}
