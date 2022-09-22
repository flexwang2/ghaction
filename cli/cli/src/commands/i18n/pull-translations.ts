/* eslint-disable no-console */
import * as repo from 'src/repo/i18n-translations';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { File } from 'src/lib/fs';
import {
    TranslationProject,
    getI18nRepoTranslationFile,
    getNeevaRepoTranslationFile,
} from 'src/i18n/helpers';
import { terminal as term } from 'terminal-kit';

interface PullTranslationsArgs extends Arguments {
    force?: boolean;
}

export const PullTranslationsCommand: CommandModule<
    Arguments,
    PullTranslationsArgs
> = {
    command: 'pull',
    describe: 'Creates a PR in the i18n repo',
    builder: (yargs) => {
        return yargs.options({
            force: {
                type: 'boolean',
                default: false,
                description: 'Force execution even if repo is in a dirty state',
            },
        });
    },
    handler: async (args): Promise<void> => {
        // Repo dirty check
        await repo.bailIfDirty(args.force);

        // Store original branch name so we can restore later
        const originalBranchName = await repo.currentBranchName();
        const cleanupAndExit = async (code: number): Promise<void> => {
            await repo.checkoutBranch(originalBranchName);
            process.exit(code);
        };

        // make sure we are on main branch and have latest changes
        await repo.checkoutBranch('main');
        await repo.pull('main');

        // Prompt for translation project, so that we know where to look
        // for translation.json
        const translationEnv = await stdio.pickFromList({
            choices: [
                'all',
                TranslationProject.WebUI,
                TranslationProject.Extension,
                TranslationProject.MktSite,
            ],
            prompt: 'Which translations would you like to pull?',
        });

        interface CopyTranslationSchema {
            src: File;
            dest: File;
        }

        // Based on the user's selected project, determine which
        // translation JSONs we need to copy over.
        const toCopy: CopyTranslationSchema[] = [];
        function addToTranslationsList(project: TranslationProject): void {
            const supportedLanguages = ['en-US', 'en-GB', 'fr-FR', 'de-DE'];
            for (const lang of supportedLanguages) {
                toCopy.push({
                    src: getI18nRepoTranslationFile(project, lang),
                    dest: getNeevaRepoTranslationFile(project, lang),
                });
            }
        }

        if (translationEnv === 'all' || translationEnv === 'mkt-site') {
            addToTranslationsList(TranslationProject.MktSite);
        }

        if (translationEnv === 'all' || translationEnv === 'webui') {
            addToTranslationsList(TranslationProject.WebUI);
        }

        if (translationEnv === 'all' || translationEnv === 'extension') {
            addToTranslationsList(TranslationProject.Extension);
        }

        // Early exit if confirmation prompt fails
        term('\n');
        if (!(await stdio.yesNoPrompt('Write files to disk?', true))) {
            await cleanupAndExit(0);
        }

        // Write translation JSON from i18n repo to neeva repo
        try {
            for (const { src, dest } of toCopy) {
                await dest.write(src.read());
                term.green(`✅ Wrote ${src} to ${dest}\n`);
            }
        } catch (err) {
            term.red().error(`🤬 Error writing to file: ${err}\n`);
            process.exit(1);
        }

        // Finish
        term('\n');
        term.green('✅ Success! \n').white(
            `Please confirm local changes and then commit and push when ready.`
        );
        cleanupAndExit(0);
    },
};
