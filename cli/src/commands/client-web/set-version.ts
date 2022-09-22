import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import * as semver from 'semver';
import * as stdio from 'src/lib/stdio';
import * as webui from 'src/webui';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';

interface SetVersionCommandArguments extends Arguments {
    newVersion?: string;
    force?: boolean;
}
export const SetVersionCommand: CommandModule<
    Arguments,
    SetVersionCommandArguments
> = {
    command: 'set-version',
    describe: 'Set version.',
    builder: (yargs) => {
        return yargs.options({
            'new-version': {
                type: 'string',
                description: 'New version',
            },
            force: {
                type: 'boolean',
                default: false,
                description: 'Force execution even if repo is in a dirty state',
            },
        });
    },
    handler: async (argv): Promise<void> => {
        if (!argv.force && (await repo.isDirty())) {
            log.error(
                'Repo is dirty, cannot continue. Hint: use --force to override this check.'
            );
            process.exit(1);
        }

        const oldVersion = await webui.getVersionAsSemVer();
        if (!oldVersion) {
            log.error('Failed to get current version.');
            process.exit(1);
        }

        // Do not prompt for input if version flag is set
        if (argv.newVersion) {
            const newVersion = semver.parse(argv.newVersion);
            if (!newVersion) {
                log.error(
                    `Failed to parse ${argv.newVersion} as a semver value; cannot proceed.`
                );
                process.exit(1);
            }
            if (await webui.setVersion(newVersion.format())) {
                log.success(
                    `Version changed from ${oldVersion.format()} to ${newVersion.format()}`
                );
                process.exit(0);
            } else {
                log.error('Failed to write new version.');
                process.exit(1);
            }
        }

        // Prompt user for new version
        log.out(`Current version is ${oldVersion.format()}`);
        const newVersion = await stdio.readSemVer({
            instruction: `New version? (suggested: ${oldVersion.major}.${
                oldVersion.minor
            }.${oldVersion.patch + 1})`,
        });

        log.out(`New version will be: ${newVersion.format()}`);

        if (!(await stdio.yesNoPrompt('Continue?', false))) {
            process.exit(1);
        }

        if (!(await webui.setVersion(newVersion.format()))) {
            log.error('Unable to write new version to disk');
            process.exit(1);
        } else {
            log.success('New version saved to disk');
            process.exit(0);
        }
    },
};
