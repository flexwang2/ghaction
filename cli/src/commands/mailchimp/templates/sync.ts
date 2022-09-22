import * as log from 'src/lib/log';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import {
    CompiledMailchimpTemplate,
    MailchimpTemplateLoader,
} from 'src/email-templates/mailchimp-template-loader';
import { MailchimpArguments } from 'src/commands/mailchimp/arguments';
import yargs from 'yargs';

interface SyncCommandArguments extends MailchimpArguments {}

export const SyncCommand: CommandModule<Arguments, SyncCommandArguments> = {
    command: 'sync',
    describe: 'Sync compiled Mailchimp templates with API',
    handler: async (argv: yargs.Arguments<SyncCommandArguments>) => {
        if (!argv.client) {
            throw 'Missing client';
        }

        const loader = MailchimpTemplateLoader.createWithDefaultPaths();
        let templates: CompiledMailchimpTemplate[];
        try {
            templates = loader.loadAll();
        } catch (err) {
            log.error('Failed to load templates', err);
            process.exit(1);
        }

        if (
            !argv.noPrompt &&
            !(await stdio.yesNoPrompt(
                'WARNING: Proceeding will modify production templates. Continue?',
                false
            ))
        ) {
            process.exit(0);
        }

        let syncCount = 0;
        for (const t of templates) {
            let exists = false;
            // First, check if a template with this id already exists
            if (t.id.length) {
                exists = await argv.client.templateExists(t.id);
            }

            // If template exists, warn before overwriting if running in prod mode and if
            // interactive mode is not disabled.
            if (
                exists &&
                !argv.noPrompt &&
                !(await stdio.yesNoPrompt(
                    `Overwrite production template "${t.name}"?`,
                    false
                ))
            ) {
                continue;
            }

            // If template doesn't exist, warn before creating a new one
            if (
                !exists &&
                !argv.noPrompt &&
                !(await stdio.yesNoPrompt(
                    `Create new template "${t.name}"?`,
                    false
                ))
            ) {
                continue;
            }

            if (!exists) {
                // Create new template
                try {
                    const res = await argv.client.createTemplate({
                        name: t.name,
                        html: t.html,
                    });
                    log.success(`Created template "${res.name}" (${res.id})`);
                    if (t.id !== res.id) {
                        log.warn(
                            `Please set template id in local file to ${res.id}`
                        );
                    }
                    syncCount++;
                    continue;
                } catch (err) {
                    log.error(`Failed to create template "${t.name}":\n`, err);
                    process.exit(1);
                }
            } else {
                // Update existing template
                try {
                    const res = await argv.client.updateTemplate(t.id, {
                        name: t.name,
                        html: t.html,
                    });
                    log.success(`Updated template "${res.name}" (${res.id})`);
                    syncCount++;
                    continue;
                } catch (err) {
                    log.error(`Failed to update template "${t.name}":\n`, err);
                    process.exit(1);
                }
            }
        }
        log.success(`Finished syncing ${syncCount} templates.`);
    },
};
