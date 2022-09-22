import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import * as webui from 'src/webui';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';

type SemVerBump = 'major' | 'minor' | 'patch';
const semVerBumpOptions: ReadonlyArray<SemVerBump> = [
    'major',
    'minor',
    'patch',
];

interface BumpVersionCommandArguments extends Arguments {
    inc?: SemVerBump;
}
export const BumpVersionCommand: CommandModule<
    Arguments,
    BumpVersionCommandArguments
> = {
    command: 'bump-version',
    describe: 'Bump current version.',
    builder: (yargs) => {
        return yargs.options({
            inc: {
                choices: semVerBumpOptions,
                description: 'Portion of version string to increment',
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

        // Calculate new version
        const currentVersion = webui.getVersionAsSemVer();
        const newVersion = webui.getVersionAsSemVer();
        if (!currentVersion || !newVersion) {
            log.error('Unable to load current version from disk');
            process.exit(1);
        }
        if (argv.inc === 'major') {
            newVersion.inc('major');
        } else if (argv.inc === 'minor') {
            newVersion.inc('minor');
        } else if (argv.inc === 'patch') {
            newVersion.inc('patch');
        }

        if (currentVersion.compare(newVersion) === 0) {
            log.info(
                'Nothing to do, exiting. Be sure to pass the --inc flag to specify which part of the version to bump.'
            );
            process.exit(0);
        }

        if (!(await webui.setVersion(newVersion.format()))) {
            log.error('Unable to update version');
            process.exit(1);
        } else {
            log.success(
                `Version updated (${currentVersion.format()} -> ${newVersion.format()})`
            );
            process.exit(0);
        }
    },
};
