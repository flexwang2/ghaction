import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import * as safariExtension from 'src/safari-extension';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';

interface PrintVersionCommandArgs extends Arguments {
    terse?: boolean;
}

export const PrintVersionCommand: CommandModule<
    Arguments,
    PrintVersionCommandArgs
> = {
    command: 'version',
    describe: 'Display current version.',
    builder: (yargs) => {
        return yargs.options({
            terse: {
                type: 'boolean',
                default: false,
                description: 'Use terse output',
            },
        });
    },
    handler: async (args): Promise<void> => {
        if (args.terse) {
            log.out(await safariExtension.getSafariExtensionFullVersion());
        } else {
            log.highlight(
                `Safari Extension marketing version: ${await safariExtension.getSafariExtensionMarketingVersion()}`
            );
            log.highlight(
                `Safari Extension build number: ${await safariExtension.getSafariExtensionBuildNumber()}`
            );
            if (await repo.isDirty()) {
                log.warn('Repo is dirty');
            }
        }
    },
};
