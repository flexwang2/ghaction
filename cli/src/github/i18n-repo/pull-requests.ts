import * as constants from '../constants';
import * as repo from 'src/repo/i18n-translations';
import * as shell from 'src/lib/exec';
import { getClientWithAuth } from '../auth';
import { terminal as term } from 'terminal-kit';

export async function getPullForCurrentBranch(): Promise<{
    url: string;
    exists: boolean;
    id: number;
}> {
    const client = getClientWithAuth();
    const head = await repo.currentBranchName();
    const result = await client.pulls.list({
        owner: constants.owner,
        repo: constants.i18nrepo,
        head: `neevaco:${head}`,
        base: 'main',
    });

    const exists = Boolean(result.data[0]);
    return {
        url: result.data[0]?.html_url,
        exists,
        id: result.data[0]?.number ?? -1,
    };
}

export async function createPullFromCurrentBranch(
    title: string,
    body: string,
    base = 'main'
): Promise<{
    url: string;
    created: boolean;
    id: number;
}> {
    const client = getClientWithAuth();
    const head = await repo.currentBranchName();

    let status = 0;
    let url = '';
    let id = -1;
    try {
        const result = await client.pulls.create({
            owner: constants.owner,
            repo: constants.i18nrepo,
            title,
            body,
            base,
            head,
        });
        status = result.status;
        url = result.data.html_url;
        id = result.data.number;
    } catch (err) {
        status = err.status;
    }

    if (status === 201) {
        return {
            url,
            created: true,
            id,
        };
    } else if (status === 422) {
        const existingPR = await getPullForCurrentBranch();
        if (!existingPR.exists) {
            throw new Error(
                `Creating pull request failed with error status = ${status}`
            );
        }
        return {
            url: existingPR.url,
            created: false,
            id,
        };
    } else {
        throw new Error(
            `Creating pull request failed with error status = ${status}`
        );
    }
}

export async function gitCommitAndPush(
    message: string,
    branch: string
): Promise<void> {
    const options = { cwd: repo.rootDir().toString() };
    let result;

    result = await shell.execfg('git add .', options);
    if (result.exitCode !== 0) {
        term.red(`🤬 Fatal git add with error: ${result.error}`);
        process.exit(1);
    }
    result = await shell.execfg(`git commit -m "${message}"`, options);
    if (result.exitCode !== 0) {
        term.red(`🤬 Fatal git commit with error: ${result.error}`);
        process.exit(1);
    }
    result = await shell.execfg(
        `git push --set-upstream origin ${branch}`,
        options
    );
    if (result.exitCode !== 0) {
        term.red(`🤬 Fatal git push with error: ${result.error}`);
        process.exit(1);
    }
}
