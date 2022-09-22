import * as log from 'src/lib/log';
import * as repo from 'src/repo';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { createPullFromCurrentBranch } from 'src/github/pull-requests';
import { mustHaveGithubAccess } from 'src/github/cli-helpers';

interface CreatePullRequestCommandArguments extends Arguments {
    force?: boolean;
    title?: string;
    body?: string;
    base?: string;
}

export const CreatePullRequestCommand: CommandModule<
    Arguments,
    CreatePullRequestCommandArguments
> = {
    command: 'create-pull-request',
    aliases: ['cpr'],
    describe: 'Create a new pull request from the current branch',
    builder: (yargs) => {
        return yargs.options({
            force: {
                type: 'boolean',
                default: false,
                description: 'Force execution even if repo is in a dirty state',
            },
            title: {
                type: 'string',
                description: 'PR title text',
            },
            body: {
                type: 'string',
                description: 'PR body text',
            },
            base: {
                type: 'string',
                default: 'master',
                description: 'Branch to pull changes into',
            },
        });
    },
    handler: async (args): Promise<void> => {
        // Repo dirty check
        await repo.bailIfDirty(args.force);

        // Ensure github creds are configured correctly
        await mustHaveGithubAccess();

        // Push current branch to remote origin
        const branch = await repo.currentBranchName();
        log.info(`Pushing ${branch} to origin...`);
        await repo.gitPushOrigin();

        // Prompt user for PR title and body values
        const title =
            args.title ??
            (await stdio.readNonEmptyString({
                instruction: 'PR title?',
            }));
        const body =
            args.body ??
            (await stdio.readNonEmptyString({
                instruction: 'PR description?',
            }));

        // Try to create a new PR
        const pr = await createPullFromCurrentBranch(title, body, args.base);
        if (pr.created) {
            // New PR was created
            log.success(`Created PR: ${pr.url}`);
        } else {
            // PR for this branch already exists
            log.success(`PR for this branch already exists: ${pr.url}`);
        }
    },
};
