import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import * as safariExtension from 'src/safari-extension';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';

interface BumpVersionCommandArguments extends Arguments {
    marketing?: 'major' | 'minor' | 'patch';
    build?: boolean;
    force?: boolean;
}

type SemVerBump = 'major' | 'minor' | 'patch';
const semVerBumpOptions: ReadonlyArray<SemVerBump> = [
    'major',
    'minor',
    'patch',
];

export const BumpVersionCommand: CommandModule<
    Arguments,
    BumpVersionCommandArguments
> = {
    command: 'bump-version',
    describe: 'Bump current version.',
    builder: (yargs) => {
        return yargs.options({
            marketing: {
                choices: semVerBumpOptions,
                description: 'Portion of marketing version string to increment',
            },
            build: {
                type: 'boolean',
                default: false,
                description: 'Increment build number',
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

        // Calculate new marketing version
        let currentMarketingVersion;
        let newMarketingVersion;
        if (argv.marketing) {
            currentMarketingVersion = await safariExtension.getSafariExtensionMarketingVersionAsSemver();
            newMarketingVersion = await safariExtension.getSafariExtensionMarketingVersionAsSemver();
            if (!currentMarketingVersion || !newMarketingVersion) {
                log.error(
                    'Unable to read current Safari Extension marketing version; cannot proceed.'
                );
                process.exit(1);
            }

            if (argv.marketing === 'major') {
                newMarketingVersion.inc('major');
            } else if (argv.marketing === 'minor') {
                newMarketingVersion.inc('minor');
            } else if (argv.marketing === 'patch') {
                newMarketingVersion.inc('patch');
            }
        }

        // Calculate new build number
        let currentBuildNumber;
        let newBuildNumber;
        if (argv.build) {
            currentBuildNumber = await safariExtension.getSafariExtensionBuildNumber();
            if (!currentBuildNumber) {
                log.error(
                    'Unable to read current Safari Extension build number; cannot proceed.'
                );
                process.exit(1);
            }
            newBuildNumber = currentBuildNumber + 1;
        }

        // Write marketing version changes to filesystem
        if (
            currentMarketingVersion &&
            newMarketingVersion &&
            currentMarketingVersion.compare(newMarketingVersion) !== 0
        ) {
            if (
                await safariExtension.setSafariExtensionMarketingVersion(
                    newMarketingVersion.format()
                )
            ) {
                log.success(
                    `Updated marketing version (${currentMarketingVersion.format()} -> ${newMarketingVersion.format()})`
                );
            } else {
                log.error(
                    `Failed to update marketing version (${currentMarketingVersion.format()} -> ${newMarketingVersion.format()})`
                );
                process.exit(1);
            }
        }

        // Write marketing version changes to filesystem
        if (
            currentBuildNumber &&
            newBuildNumber &&
            currentBuildNumber !== newBuildNumber
        ) {
            if (
                await safariExtension.setSafariExtensionBuildNumber(
                    newBuildNumber
                )
            ) {
                log.success(
                    `Updated build number (${currentBuildNumber} -> ${newBuildNumber})`
                );
            } else {
                log.error(
                    `Failed to update build number (${currentBuildNumber} -> ${newBuildNumber})`
                );
                process.exit(1);
            }
        }
    },
};
