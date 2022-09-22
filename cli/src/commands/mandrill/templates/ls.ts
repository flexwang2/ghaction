import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MandrillArguments } from '../arguments';
import { Template } from 'src/mandrill/template';
import { terminal as term } from 'terminal-kit';
import yargs from 'yargs';

interface LsCommandArguments extends MandrillArguments {}

export const LsCommand: CommandModule<Arguments, LsCommandArguments> = {
    command: 'ls',
    describe: 'List Mandrill templates',
    handler: async (
        argv: yargs.Arguments<MandrillArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }

        let templates: Template[];
        try {
            templates = await argv.client.listTemplates();
        } catch (err) {
            log.error(
                'Unable to retrieve templates from Mandrill. Please make sure you have set a valid Mandrill api key using the --apiKey flag.'
            );
            log.out(err);
            process.exit(1);
        }

        const rows = templates.map((t): string[] => [
            t.name,
            t.slug,
            t.labels.join(', '),
            t.hasUnpublishedChanges ? 'Yes' : 'No',
        ]);

        term.table(
            [['Name', 'Slug', 'Labels', 'Unpublished changes'], ...rows],
            {
                hasBorder: true,
                contentHasMarkup: false,
                width: 120,
                fit: true,
            }
        );
    },
};
