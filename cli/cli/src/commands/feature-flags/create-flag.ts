/* eslint-disable no-console */
import * as repo from 'src/repo';
import * as shell from 'src/lib/exec';
import * as stdio from 'src/lib/stdio';
import * as uuid from 'uuid';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { FeatureFlagType } from 'src/feature-flags/feature-flag';
import { convertToSnakeCase } from 'src/lib/strings/format';
import { createExperimentForFlag } from 'src/feature-flags/experiment-helpers';
import { createFlag, getAllFlagNames } from 'src/feature-flags/flag-helpers';
import { createPullFromCurrentBranch } from 'src/github/pull-requests';
import { mustHaveGithubAccess } from 'src/github/cli-helpers';
import { terminal as term } from 'terminal-kit';

interface CreateFlagCommandArguments extends Arguments {
    force?: boolean;
}

export const CreateFlagCommand: CommandModule<
    Arguments,
    CreateFlagCommandArguments
> = {
    command: 'create',
    aliases: ['new'],
    describe: 'Create a new feature flag',
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

        // make sure we are on master branch and have latest changes
        await repo.checkoutBranch('master');
        await repo.pull('master');

        // Prompt for name
        const flagName = await stdio.readValue({
            instruction: 'Flag name',
            description: [
                'Flag names are generally prefixed by functional area.\n',
                "For example, the 'client.maps' flag controls interactive\n",
                'map features within the client app.',
            ],
            validation: [
                {
                    validate: (value: string): boolean =>
                        /^[A-Za-z0-9_.]+$/.test(value),
                    errorMsg: 'Flag name must match regex /^[A-Za-z0-9_.]+$/',
                },
                {
                    validate: (value: string): boolean =>
                        !getAllFlagNames().has(value),
                    errorMsg: 'Flag name already exists',
                },
            ],
        });

        // Create a new branch based on flag name. Append a uuid
        // in an attempt to make branch name unique.
        try {
            const branchName = await repo.calcBranchNameWithUserPrefix(
                `${convertToSnakeCase(flagName)}-${uuid.v4()}`
            );
            await repo.createBranchAndCheckout(branchName);
        } catch (err) {
            term.red(`🤬 Failed to create new git branch\n`);
            console.error(err);
            console.error(err.stack);
            process.exit(1);
        }

        // Set dummy flag ID (we'll fill this in from PR# later)
        term('\n');
        let flagID = 9999;
        const autoIDFromPR = await stdio.yesNoPrompt(
            'Auto create a PR? This is required to generate flag ID',
            true
        );
        if (autoIDFromPR) {
            // Ensure github creds are configured correctly
            await mustHaveGithubAccess();
        } else {
            term('\n');
            flagID = await stdio.readInt({
                instruction: 'Flag ID',
            });
        }

        // Prompt for type
        term('\n');
        const flagType = await stdio.pickFromList<FeatureFlagType>({
            choices: ['bool', 'int', 'float', 'string'],
            prompt: 'Flag type',
        });

        // Prompt for description
        term('\n');
        const flagDescription = await stdio.readValue({
            instruction: 'Flag description',
            description: [
                'Please enter a brief (one sentence) description of what this flag will control.',
            ],
            validation: [
                {
                    errorMsg: 'Description is too short',
                    validate: (v): boolean => v.length > 10,
                },
                {
                    errorMsg: 'Description is too long',
                    validate: (v): boolean => v.length < 200,
                },
            ],
        });

        // Prompt for client visible
        term('\n');
        const flagClientVisible = await stdio.yesNoPrompt(
            'Client visible?',
            false
        );

        // Owners
        term('\n');
        const flagOwners = await stdio.readValue<string[]>({
            instruction: 'Flag owners',
            description: ['Comma separated list of flag owners'],
            validation: [
                {
                    errorMsg: 'Please enter at least one owner',
                    validate: (v): boolean => v.length > 1,
                },
            ],
            transformation: (v): string[] =>
                v.split(',').map((owner: string): string => owner.trim()),
        });

        // Create the flag
        const flag = createFlag({
            id: flagID,
            type: flagType,
            name: flagName,
            description: flagDescription,
            clientVisible: flagClientVisible,
            owners: flagOwners,
        });

        term.bold().green('\nPreview flag:\n');
        term.defaultColor(
            JSON.stringify(
                {
                    flagName,
                    flagID,
                    flagType,
                    flagDescription,
                    flagClientVisible,
                    flagOwners,
                },
                null,
                4
            )
        );
        term('\n');

        // Early exit if confirmation prompt fails
        if (!(await stdio.yesNoPrompt('\nWrite files to disk?', false))) {
            await cleanupAndExit(0);
        }

        // yaml -- Confirm overwrite if file exists
        if (flag.yamlFile?.exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `File ${flag.yamlFile?.path} exists, overwrite?`,
                    false
                ))
            ) {
                await cleanupAndExit(0);
            }
        }

        // go -- Confirm overwrite if file exists
        if (flag.goFile?.exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `File ${flag.goFile?.path} exists, overwrite?`,
                    false
                ))
            ) {
                await cleanupAndExit(0);
            }
        }

        // write to disk
        try {
            await flag.writeToDisk();
            term.green(`✅ Wrote ${flag.yamlFile?.path}\n`);
            term.green(`✅ Wrote ${flag.goFile?.path}\n`);
        } catch (err) {
            term.red().error(`🤬 Error: ${err}\n`);
            process.exit(1);
        }

        const branch = await repo.currentBranchName();
        let gitSequence = 1;
        async function gitCommitAndPush(message: string): Promise<void> {
            const options = { cwd: repo.rootDir().toString() };
            let result;

            result = await shell.execfg('git add .', options);
            if (result.exitCode !== 0) {
                term.red(
                    `🤬 Fatal git add (${gitSequence}) error: ${result.error}`
                );
                process.exit(1);
            }
            result = await shell.execfg(`git commit -m "${message}"`, options);
            if (result.exitCode !== 0) {
                term.red(
                    `🤬 Fatal git commit (${gitSequence}) error: ${result.error}`
                );
                process.exit(1);
            }
            result = await shell.execfg(
                `git push --set-upstream origin ${branch}`,
                options
            );
            if (result.exitCode !== 0) {
                term.red(
                    `🤬 Fatal git push (${gitSequence}) error: ${result.error}`
                );
                process.exit(1);
            }
            gitSequence++;
        }

        // commit and push
        let prUrl = '<unknown>';
        if (autoIDFromPR) {
            await gitCommitAndPush(`Add feature flag: ${flag.metadata.name}`);

            // Try to create a new PR
            const pr = await createPullFromCurrentBranch(
                `Add feature flag: ${flag.metadata.name}`,
                '',
                'master'
            );
            if (!pr.created) {
                term.red(`🤬 Fatal error: unable to create PR`);
                process.exit(1);
            }
            prUrl = pr.url;

            // Reset flag id
            flag.id = pr.id;
            await flag.writeToDisk();

            // Commit changes and push again
            await gitCommitAndPush(
                `Add feature flag: ${flag.metadata.name} (update ID)`
            );
        }

        // prompt user to create experiment
        term('\n');
        if (!(await stdio.yesNoPrompt('Create experiment?', true))) {
            await cleanupAndExit(0);
        }

        // create experiment
        const experiment = createExperimentForFlag(flag);

        // Confirm overwrite if file exists
        if (experiment.yamlFile?.exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `File ${experiment.yamlFile?.path} exists, overwrite?`,
                    false
                ))
            ) {
                await cleanupAndExit(0);
            }
        }

        // write to disk
        try {
            experiment.writeToDisk();
            term.green(`✅ Wrote ${experiment.yamlFile?.path}\n`);
        } catch (err) {
            term.red().error(`🤬 Error: ${err}\n`);
            process.exit(1);
        }

        if (autoIDFromPR) {
            // commit and push experiment
            await gitCommitAndPush(`Add experiment: ${experiment.name}`);

            // if we got this far without calling process.exit, then all is well
            term('\n');
            term.green('✅ Success! \n').white(`See PR: ${prUrl}`);
        } else {
            term('\n');
            term.green('✅ Success! \n').white(
                `Please confirm local changes and then commit and push when ready.`
            );
        }
        await cleanupAndExit(0);
    },
};
