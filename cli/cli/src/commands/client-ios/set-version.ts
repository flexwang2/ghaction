import * as log from 'src/lib/log';
import * as nativeui from 'src/nativeui';
import * as repo from 'src/repo';
import * as semver from 'semver';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';

interface SetVersionCommandArguments extends Arguments {
    marketing?: string;
    build?: number;
    force?: boolean;
    terse?: boolean;
}

export const SetVersionCommand: CommandModule<
    Arguments,
    SetVersionCommandArguments
> = {
    command: 'set-version',
    describe: 'Set version.',
    builder: (yargs) => {
        return yargs.options({
            marketing: {
                type: 'string',
                description: 'New marketing version',
            },
            build: {
                type: 'number',
                description: 'New build number',
            },
            force: {
                type: 'boolean',
                default: false,
                description: 'Force execution even if repo is in a dirty state',
            },
            terse: {
                type: 'boolean',
                default: false,
                description: 'Terse output',
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

        let marketingVersionUpdated = false;
        let buildNumberUpdated = false;
        let packageVersionUpdated = false;

        // If flags are passed, then do update without prompting user
        if (
            typeof argv.marketing === 'string' ||
            typeof argv.build === 'number'
        ) {
            if (typeof argv.marketing === 'string') {
                const parsed = semver.parse(argv.marketing);
                if (!parsed) {
                    log.error(
                        `Cannot parse input string "${argv.marketing}" as semver`
                    );
                    process.exit(1);
                }
                if (!(await nativeui.setIosMarketingVersion(parsed.format()))) {
                    log.error('Unable to update marketing version');
                    process.exit(1);
                }
                marketingVersionUpdated = true;

                if (!(await nativeui.setPackageJSONVersion(parsed.format()))) {
                    log.error('Unable to update package.json version');
                    process.exit(1);
                }
                packageVersionUpdated = true;
            }
            if (typeof argv.build === 'number') {
                if (!(await nativeui.setIosBuildNumber(argv.build))) {
                    log.error('Unable to update build number');
                    process.exit(1);
                }
                buildNumberUpdated = true;
            }

            if (!argv.terse) {
                if (marketingVersionUpdated) {
                    log.success('Updated marketing version');
                }
                if (packageVersionUpdated) {
                    log.success('Updated package.json version');
                }
                if (buildNumberUpdated) {
                    log.success('Updated build number');
                }
            }

            const newVersion = await nativeui.getIosFullVersion();
            if (!newVersion) {
                log.error('Unable to read new version from disk.');
                process.exit(1);
            } else {
                log.success(`New version set to ${newVersion}`);
                process.exit(0);
            }
        }

        // Prompt user for new versions
        const currentMarketingVersion = await nativeui.getIosMarketingVersionAsSemver();
        const currentBuildNumber = await nativeui.getIosBuildNumber();

        if (!currentMarketingVersion) {
            log.error('Unable to load current marketing version');
            process.exit(1);
        }

        if (!currentBuildNumber) {
            log.error('Unable to load current build number');
            process.exit(1);
        }

        log.out(
            `Current version is ${currentMarketingVersion}-${currentBuildNumber}`
        );

        const nextMarketingVersion = await stdio.readSemVer({
            instruction: `Next marketing version? (suggested: ${
                currentMarketingVersion.major
            }.${currentMarketingVersion.minor}.${
                currentMarketingVersion.patch + 1
            })`,
        });

        const nextBuildNumber = await stdio.readInt({
            instruction: `Next build number? (suggested: ${
                currentBuildNumber + 1
            })`,
        });

        log.out(
            `Next version will be: ${nextMarketingVersion.format()}-${nextBuildNumber}`
        );

        if (!(await stdio.yesNoPrompt('Continue?', false))) {
            process.exit(1);
        }

        if (
            !(await nativeui.setIosMarketingVersion(
                nextMarketingVersion.format()
            ))
        ) {
            log.error('Failed to update marketing version');
            process.exit(1);
        }

        if (
            !(await nativeui.setPackageJSONVersion(
                nextMarketingVersion.format()
            ))
        ) {
            log.error('Failed to update package.json version');
            process.exit(1);
        }

        if (!(await nativeui.setIosBuildNumber(nextBuildNumber))) {
            log.error('Failed to update build number');
            process.exit(1);
        }

        const newVersion = await nativeui.getIosFullVersion();
        if (!newVersion) {
            log.error('Unable to read new version from disk.');
            process.exit(1);
        } else {
            log.success(`New version set to ${newVersion}`);
            process.exit(0);
        }
    },
};
