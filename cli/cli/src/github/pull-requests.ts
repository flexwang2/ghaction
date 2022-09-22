import * as constants from './constants';
import * as repo from 'src/repo';
import { getClientWithAuth } from './auth';

export async function getPullForCurrentBranch(): Promise<{
    url: string;
    exists: boolean;
    id: number;
}> {
    const client = getClientWithAuth();
    const head = await repo.currentBranchName();
    const result = await client.pulls.list({
        owner: constants.owner,
        repo: constants.repo,
        head: `neevaco:${head}`,
        base: 'master',
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
    base = 'master'
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
            repo: constants.repo,
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
