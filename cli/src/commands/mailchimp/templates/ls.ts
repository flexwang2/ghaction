import * as api from 'src/mailchimp/api';
import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';
import { terminal as term } from 'terminal-kit';
import yargs from 'yargs';

interface LsCommandArguments extends MailchimpArguments {
    folders?: boolean;
}

export const LsCommand: CommandModule<Arguments, LsCommandArguments> = {
    command: 'ls',
    describe: 'List Mailchimp templates',
    builder: (yargs) => {
        return yargs.option('folders', {
            alias: 'f',
            default: false,
            type: 'boolean',
            description: 'List folders only',
        });
    },
    handler: async (
        argv: yargs.Arguments<MailchimpArguments>
    ): Promise<void> => {
        if (!argv.client) {
            throw 'Missing client';
        }

        // List all folders
        if (argv.folders) {
            let folders: api.TemplateFolder[];
            try {
                folders = await argv.client.listAllTemplateFolders();
            } catch (err) {
                log.error(
                    'Unable to retrieve template folders from Mailchimp. Please make sure you have set a valid Mailchimp api key using the --apiKey flag.'
                );
                log.out(err);
                process.exit(1);
            }
            const rows = folders.map((f): string[] => [
                f.name,
                f.id,
                f.count.toString(),
            ]);
            term.table([['Name', 'ID', 'Template Count'], ...rows], {
                hasBorder: true,
                contentHasMarkup: false,
                width: 120,
                fit: true,
            });
            process.exit(1);
        }

        // List all templates
        let templates: api.Template[];
        try {
            templates = await argv.client.listAllTemplates();
        } catch (err) {
            log.error(
                'Unable to retrieve templates from Mailchimp. Please make sure you have set a valid Mailchimp api key using the --apiKey flag.'
            );
            log.out(err);
            process.exit(1);
        }
        const rows = templates.map((t): string[] => [
            t.name,
            t.id,
            t.created_by,
            t.content_type,
            t.date_created,
            t.date_edited,
        ]);
        term.table(
            [
                [
                    'Name',
                    'ID',
                    'Author',
                    'ContentType',
                    'Created',
                    'Last Updated',
                ],
                ...rows,
            ],
            {
                hasBorder: true,
                contentHasMarkup: false,
                width: 120,
                fit: true,
            }
        );
        log.info(`Found ${templates.length} templates`);
        process.exit(1);
    },
};
