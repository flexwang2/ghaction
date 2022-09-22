import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { File } from 'src/lib/fs';
import { MandrillArguments } from 'src/commands/mandrill/arguments';
import { MergeVar, SendTemplateArgs } from 'src/mandrill/client';
import { getStagingSlug } from 'src/mandrill/constants';
import yargs from 'yargs';

interface SendCommandArguments extends MandrillArguments {
    // Recipient email
    toEmail?: string;
    // Recipient name
    toName?: string;
    // Sender email address
    fromEmail?: string;
    // Sender name
    fromName?: string;
    // Raw merge variable array
    var?: string[];
    // Input file containing merge variables in JSON format
    varFile?: string;
    // Parsed merge variables
    mergeVars?: MergeVar[];
    // Mandrill template slug
    slug?: string;
    // Subject line
    subject?: string;
}

export const SendCommand: CommandModule<Arguments, SendCommandArguments> = {
    command: 'send <slug>',
    describe: 'Send a test email using a template',
    builder: (yargs) => {
        return (
            yargs
                .positional('slug', {
                    describe: 'Mandrill template slug',
                    type: 'string',
                })
                .option('toEmail', {
                    describe: 'Recipient email address',
                    demandOption: true,
                    type: 'string',
                })
                .option('toName', {
                    describe: 'Recipient name',
                    type: 'string',
                })
                .option('fromEmail', {
                    describe: 'Sender email',
                    type: 'string',
                })
                .option('fromName', {
                    describe: 'Sender name',
                    type: 'string',
                })
                .option('subject', {
                    describe: 'Subject line',
                    type: 'string',
                })
                .option('var', {
                    describe: 'Merge variable. Format: name=value',
                    type: 'string',
                    array: true,
                })
                .option('varFile', {
                    describe:
                        'JSON file containing merge variables. Format: { name: value }',
                    type: 'string',
                })
                // Modify slug if needed in staging mode
                .middleware(
                    (argv: yargs.Arguments<SendCommandArguments>): void => {
                        if (argv.staging && argv.slug) {
                            argv.slug = getStagingSlug(argv.slug);
                        }
                    }
                )
                // Parse mail merge variables
                .middleware(
                    (argv: yargs.Arguments<SendCommandArguments>): void => {
                        let varMap: Record<string, any> = {};

                        // If variables are set with both --var and --varFile are specified,
                        // values specified with --var will take precedence in the event of conflicts.

                        // Load variables from file
                        if (argv.varFile) {
                            try {
                                varMap = JSON.parse(
                                    new File(argv.varFile).read()
                                );
                            } catch (err) {
                                log.error(
                                    `Error parsing merge variables from ${argv.varFile}`
                                );
                                throw err;
                            }
                        }

                        // Parse --var arguments
                        for (const v of argv.var ?? []) {
                            if (!v.includes('=')) {
                                continue;
                            }

                            const [name, value] = v.split('=');
                            varMap[name] = value;
                        }

                        // Convert map of vars to array of { name, content } objects
                        argv.mergeVars = Object.entries(varMap).map((e) => ({
                            name: e[0],
                            content: e[1],
                        }));
                    }
                )
        );
    },
    handler: async (argv: yargs.Arguments<SendCommandArguments>) => {
        if (!argv.client) {
            throw 'Missing client';
        }
        if (!argv.slug) {
            throw 'Missing slug';
        }
        if (!argv.toEmail) {
            throw 'Missing toEmail';
        }
        if (!argv.mergeVars) {
            throw 'Missing mergeVars';
        }

        const sendArgs: SendTemplateArgs = {
            to: [
                {
                    name: argv.toName,
                    email: argv.toEmail,
                },
            ],
            cc: [],
            bcc: [],
            fromEmail: argv.fromEmail,
            fromName: argv.fromName,
            subject: argv.subject,
            globalMergeVars: argv.mergeVars,
        };

        log.info('Sending test email with args:');
        // eslint-disable-next-line no-console
        console.table(sendArgs);

        try {
            // First make sure the template exists
            if (!(await argv.client.templateExists(argv.slug))) {
                log.error(`Template ${argv.slug} does not exist.`);
                process.exit(1);
            }

            // Now send a test email using the template
            const res = await argv.client.sendTemplate(argv.slug, sendArgs);
            log.info('Result:');
            // eslint-disable-next-line no-console
            console.table(res);
            let success = 0;
            let errors = 0;
            for (const r of res) {
                if (r.status === 'sent') {
                    log.success(`Sent ${argv.slug} to ${r.email}`);
                    success++;
                } else {
                    log.error(`Failed sending ${argv.slug} to ${r.email}`);
                    errors++;
                }
            }
            log.out(`Sent ${success} messages, ${errors} errors`);
            if (errors > 0) {
                process.exit(1);
            }
        } catch (err) {
            log.error(
                'Unable to send template with slug ${argv.slug} from Mandrill. Please make sure the slug exists and that you have set a valid Mandrill api key using the --apiKey flag.'
            );
            return process.exit(1);
        }
    },
};
