import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { MandrillArguments } from 'src/commands/mandrill/arguments';
import { Template } from 'src/mandrill/template';
import { terminal as term } from 'terminal-kit';
import yargs from 'yargs';

interface InfoCommandArguments extends MandrillArguments {
    // Mandrill template slug
    slug?: string;
}

export const InfoCommand: CommandModule<Arguments, InfoCommandArguments> = {
    command: 'info <slug>',
    describe: 'Get info about a single template',
    builder: (yargs) => {
        return yargs.positional('slug', {
            describe: 'Mandrill template slug',
            type: 'string',
        });
    },
    handler: async (argv: yargs.Arguments<InfoCommandArguments>) => {
        if (!argv.client) {
            throw 'Missing client';
        }
        if (!argv.slug) {
            throw 'Missing slug';
        }

        let template: Template;
        try {
            template = await argv.client.getTemplate(argv.slug);
        } catch (err) {
            log.error(
                'Unable to retrieve template with slug ${argv.slug} from Mandrill. Please make sure the slug exists and that you have set a valid Mandrill api key using the --apiKey flag.'
            );
            return process.exit(1);
        }

        term.table(
            [
                ['Name', template.name],
                ['Slug', template.slug],
                ['Created', template.created],
                ['Last modified', template.lastModified],
                ['Last published', template.lastPublished],
                [
                    'Unpublished changes',
                    template.hasUnpublishedChanges ? 'Yes' : 'No',
                ],
                ['Labels', template.labels.join(', ')],
            ],
            {
                hasBorder: true,
                fit: true,
                width: 60,
                contentHasMarkup: true,
            }
        );
    },
};
