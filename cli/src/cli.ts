import { Arguments } from './arguments';
/* eslint-disable no-unused-expressions */
import {
    AvroCommand,
    CDPushCommand,
    ClientExtensionCommand,
    ClientIosCommand,
    ClientSafariExtensionCommand,
    ClientWebCommand,
    DatabricksCommand,
    EmailTemplatesCommand,
    FeatureFlagCommand,
    GithubCommand,
    GraphqlCommand,
    I18nCommand,
    InstallCommand,
    KubeCommand,
    MailchimpCommand,
    MandrillCommand,
    ModeCommand,
    NeevaLibCommand,
    NeevaLibDomCommand,
    SystemShowCapsCommand,
    UninstallCommand,
    WhereIsMyCodeCommand,
} from 'src/commands';
import { usrLocalBinNeeva } from 'src/install/usr-local';
import { verbosity } from 'src/lib/log';
import yargs from 'yargs';

(yargs as yargs.Argv<Arguments>)
    .scriptName(usrLocalBinNeeva().basename)
    .usage('Usage: $0 <command>')
    .strict()
    .options({
        'no-prompt': {
            type: 'boolean',
            alias: 'y',
            default: false,
            description: 'Skip all prompts',
        },
        verbosity: {
            type: 'string',
            alias: 'v',
            default: 'info',
            description:
                'Log verbosity level; one of "none", "error", "warn", "info", "debug", "all"',
        },
        cwd: {
            type: 'string',
            default: '',
            description: 'Set the current working directory for the command.',
        },
    })
    .middleware(verbosity)
    .middleware((args: Arguments): void => {
        if (args.cwd) {
            process.chdir(args.cwd);
        }
    })
    .command(AvroCommand)
    .command(ClientExtensionCommand)
    .command(ClientIosCommand)
    .command(ClientSafariExtensionCommand)
    .command(ClientWebCommand)
    .command(CDPushCommand)
    .command(DatabricksCommand)
    .command(EmailTemplatesCommand)
    .command(FeatureFlagCommand)
    .command(GithubCommand)
    .command(GraphqlCommand)
    .command(I18nCommand)
    .command(InstallCommand)
    .command(KubeCommand)
    .command(MailchimpCommand)
    .command(MandrillCommand)
    .command(ModeCommand)
    .command(NeevaLibCommand)
    .command(NeevaLibDomCommand)
    .command(SystemShowCapsCommand)
    .command(UninstallCommand)
    .command(WhereIsMyCodeCommand)
    .demandCommand().argv;
