/* eslint-disable no-console */
import * as repo from 'src/repo/i18n-translations';
import * as stdio from 'src/lib/stdio';
import * as uuid from 'uuid';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import {
    TranslationProject,
    getI18nRepoTranslationFile,
    getNeevaRepoTranslationFile,
} from 'src/i18n/helpers';
import {
    createPullFromCurrentBranch,
    gitCommitAndPush,
} from 'src/github/i18n-repo/pull-requests';
import { mustHaveGithubAccess } from 'src/github/cli-helpers';
import { terminal as term } from 'terminal-kit';

interface CreateTranslationPRArgs extends Arguments {
    force?: boolean;
}

export const CreateTranslationPRCommand: CommandModule<
    Arguments,
    CreateTranslationPRArgs
> = {
    command: 'create-job',
    aliases: ['translate', 'create', 'job'],
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
        const translationEnv = await stdio.pickFromList<TranslationProject>({
            choices: [
                TranslationProject.WebUI,
                TranslationProject.Extension,
                TranslationProject.MktSite,
            ],
            prompt: 'Which translation project are you working on?',
        });

        // Defining file objects
        const srcJSON = getNeevaRepoTranslationFile(translationEnv, 'en-US');
        const destJSON = getI18nRepoTranslationFile(translationEnv, 'en-US');

        // Verify that the source translation.json file exists
        if (!srcJSON.exists()) {
            throw new Error(
                `Could not find en-US translation.json file at ${srcJSON}.`
            );
        }

        // Create a new branch
        try {
            const branchName = await repo.calcBranchNameWithUserPrefix(
                `translations-${translationEnv}-${uuid.v4()}`
            );
            await repo.createBranchAndCheckout(branchName);
        } catch (err) {
            term.red(`🤬 Failed to create new git branch\n`);
            console.error(err);
            process.exit(1);
        }

        // Early exit if confirmation prompt fails
        term('\n');
        if (!(await stdio.yesNoPrompt('Write files to disk?', true))) {
            await cleanupAndExit(0);
        }

        // Write file at srcJSON to destJSON
        try {
            await destJSON.write(srcJSON.read());
            term.green(`✅ Wrote ${srcJSON} to ${destJSON}}`);
        } catch (err) {
            term.red().error(`🤬 Error writing to file: ${err}\n`);
            process.exit(1);
        }

        // Ask user if it's okay to create a PR
        term('\n');
        const shouldAutoCreatePR = await stdio.yesNoPrompt(
            'Auto create a PR? This is required to have the job appear in Smartling.',
            true
        );
        if (shouldAutoCreatePR) {
            // Ensure github creds are configured correctly
            await mustHaveGithubAccess();
        } else {
            term('\n');
        }

        term('\n');
        // Get title for PR
        let prTitle = 'Add translations';
        if (shouldAutoCreatePR) {
            prTitle = await stdio.readValue({
                instruction: 'PR title',
                description: [
                    'Please enter a title for your PR. This will be used to identify your job in Smartling.',
                ],
            });
        }

        const branch = await repo.currentBranchName();
        // commit and push
        let prUrl = '<unknown>';
        if (shouldAutoCreatePR) {
            await gitCommitAndPush(
                `Updating translations for ${translationEnv}`,
                branch
            );

            // Try to create a new PR
            const pr = await createPullFromCurrentBranch(prTitle, '', 'main');
            if (!pr.created) {
                term('\n');
                term.red(`🤬 Fatal error: unable to create PR`);
                process.exit(1);
            }
            prUrl = pr.url;
        }

        // Finish
        if (shouldAutoCreatePR) {
            term('\n');
            term.green('✅ Success! \n').white(`See PR: ${prUrl}`);
            cleanupAndExit(0);
        } else {
            term('\n');
            term.green('✅ Success! \n').white(
                `Please confirm local changes and then commit and push when ready.`
            );
            process.exit(0);
        }
    },
};
