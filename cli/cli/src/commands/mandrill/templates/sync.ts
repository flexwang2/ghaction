import * as log from 'src/lib/log';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import {
    CompiledMandrillTemplate,
    MandrillTemplateLoader,
} from 'src/email-templates/mandrill-template-loader';
import { MandrillArguments } from 'src/commands/mandrill/arguments';
import { getStagingSlug } from 'src/mandrill/constants';
import yargs from 'yargs';

interface SyncCommandArguments extends MandrillArguments {
    // Mandrill template slug
    slug?: string;
    // Publish - if false, template changes will be saved as drafts
    publish?: boolean;
}

export const SyncCommand: CommandModule<Arguments, SyncCommandArguments> = {
    command: 'sync <slug>',
    describe: 'Sync templates, uploading local data to Mandrill',
    builder: (yargs) => {
        return (
            yargs
                .positional('slug', {
                    describe:
                        'Mandrill template slug. Pass `all` to sync all templates',
                    type: 'string',
                })
                .option('publish', {
                    describe:
                        'Publish - if false, template changes will be saved as drafts',
                    type: 'boolean',
                    default: false,
                })
                // Modify slug if needed in staging mode
                .middleware(
                    (argv: yargs.Arguments<SyncCommandArguments>): void => {
                        if (argv.staging && argv.slug && argv.slug !== 'all') {
                            argv.slug = getStagingSlug(argv.slug);
                        }
                    }
                )
        );
    },
    handler: async (argv: yargs.Arguments<SyncCommandArguments>) => {
        if (!argv.client) {
            throw 'Missing client';
        }
        if (!argv.slug) {
            throw 'Missing slug';
        }

        const loader = MandrillTemplateLoader.createWithDefaultPaths(
            !!argv.staging
        );
        let templates: CompiledMandrillTemplate[];
        try {
            templates = loader.loadAll();
        } catch (err) {
            log.error('Failed to load templates', err);
            process.exit(1);
        }

        if (
            !argv.staging &&
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
            // If a slug was specified, only sync that template
            if (argv.slug !== 'all' && t.slug !== argv.slug) {
                continue;
            }

            // First, check if a template with this slug already exists
            const exists = await argv.client.templateExists(t.slug);

            // If template exists, warn before overwriting if running in prod mode and if
            // interactive mode is not disabled.
            if (
                exists &&
                !argv.staging &&
                !argv.noPrompt &&
                !(await stdio.yesNoPrompt(
                    `Overwrite production ${t.slug} template?`,
                    false
                ))
            ) {
                continue;
            }

            if (!exists) {
                // Create new template
                try {
                    const res = await argv.client.addTemplate({
                        name: t.name,
                        subject: t.subject,
                        fromEmail: t.fromEmail,
                        fromName: t.fromName,
                        text: t.text,
                        html: t.code,
                        labels: t.labels,
                        publish: !!argv.publish,
                    });
                    log.success(`Created template "${res.name}" (${res.slug})`);
                    if (t.slug !== res.slug) {
                        log.warn(
                            `Template slug value from server (${res.slug}) does not match client value (${t.slug}). You may need to update the local template definition.`
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
                    const res = await argv.client.updateTemplate({
                        slug: t.slug,
                        name: t.name,
                        subject: t.subject,
                        fromEmail: t.fromEmail,
                        fromName: t.fromName,
                        text: t.text,
                        html: t.code,
                        labels: t.labels,
                        publish: !!argv.publish,
                    });
                    log.success(`Updated template "${res.name}" (${res.slug})`);
                    if (t.slug !== res.slug) {
                        log.warn(
                            `Template slug value from server (${res.slug}) does not match client value (${t.slug}). You may need to update the local template definition.`
                        );
                    }
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
