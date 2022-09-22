import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import {
    archiveDir,
    buildArchive,
    exportIpa,
    ipaFile,
    uploadIpa,
} from 'src/nativeui/build';
import { getIosFullVersion } from 'src/nativeui/ios-version';
import { lintPrivateKeysDir } from 'src/nativeui/app-store-connect';

interface BuildArchiveCommandArguments extends Arguments {
    force?: boolean;
}

export const BuildArchiveCommand: CommandModule<
    Arguments,
    BuildArchiveCommandArguments
> = {
    command: 'build-archive',
    aliases: 'archive',
    describe: 'Build archive',
    builder: (yargs) => {
        return yargs.options({
            force: {
                type: 'boolean',
                default: false,
                description: 'Force execution even if repo is in a dirty state',
            },
        });
    },
    handler: async (argv): Promise<void> => {
        // Exit early if repo is dirty and force is not set
        await repo.bailIfDirty(argv.force);

        // Make sure credentials are configured
        if (!lintPrivateKeysDir()) {
            log.error('App store connect credentials are not configured');
            log.out('Please run `cli.sh client-ios build-setup` command.');
            process.exit(1);
        }

        const version = await getIosFullVersion();
        log.highlight(`Starting build for iOS client ${version}`);

        let doBuildArchive = true;
        if (archiveDir().exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `Archive exists (${archiveDir().path}). Rebuild?`
                ))
            ) {
                doBuildArchive = false;
            } else {
                try {
                    await archiveDir().rm();
                } catch (err) {
                    log.error('Unable to delete archive directory.');
                    process.exit(1);
                }
            }
        }

        if (doBuildArchive) {
            log.info('Building archive...');
            const { exitCode } = await buildArchive();
            if (exitCode !== 0) {
                log.error('Building archive failed.');
                process.exit(1);
            }
            log.success(`Archive built (${archiveDir().path})`);
        }

        let doExportIpa = true;
        if (ipaFile().exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `IPA file exists (${ipaFile().path}). Re-export?`
                ))
            ) {
                doExportIpa = false;
            } else {
                try {
                    await ipaFile().rm();
                } catch (err) {
                    log.error('Unable to delete existing IPA file.');
                    process.exit(1);
                }
            }
        }

        if (doExportIpa) {
            log.info('Exporting IPA...');
            const { exitCode } = await exportIpa();
            if (exitCode !== 0) {
                log.error('Exporting IPA file failed');
                process.exit(1);
            }
            log.success(`IPA file exported (${ipaFile().path})`);
        }

        if (
            !(await stdio.yesNoPrompt(
                `Upload ${version} to App Store Connect?`
            ))
        ) {
            process.exit(1);
        } else {
            const { exitCode } = await uploadIpa();
            if (exitCode !== 0) {
                log.error('Upload failed');
                process.exit(1);
            }
        }

        log.success('Build complete');
    },
};
