import * as log from 'src/lib/log';
import * as nativeui from 'src/nativeui';
import * as repo from 'src/repo';
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
            log.out(await nativeui.getIosFullVersion());
        } else {
            log.highlight(
                `ios marketing version: ${await nativeui.getIosMarketingVersion()}`
            );
            log.highlight(
                `ios build number: ${await nativeui.getIosBuildNumber()}`
            );
            if (await repo.isDirty()) {
                log.warn('Repo is dirty');
            }
        }
    },
};
