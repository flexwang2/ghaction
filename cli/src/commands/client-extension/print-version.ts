import * as extensions from 'src/extensions';
import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { extensionDetails, getProjectRoot } from 'src/extensions';

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
            magpie: {
                type: 'boolean',
                default: false,
                description: 'Is megpie version',
            },
        });
    },
    handler: async (args): Promise<void> => {
        let ext = extensionDetails.NeevaForChrome;

        if (args.magpie) {
            ext = extensionDetails.NeevaCookieCutterForChrome;
        }
        if (args.terse) {
            log.out(
                await extensions.getChromeExtensionFullVersion(
                    getProjectRoot(ext)
                )
            );
        } else {
            log.highlight(
                `Chrome extension Version: ${await extensions.getChromeExtensionFullVersion(
                    getProjectRoot(ext)
                )}`
            );
            if (await repo.isDirty()) {
                log.warn('Repo is dirty');
            }
        }
    },
};
