import * as log from 'src/lib/log';
import { Directory } from 'src/lib/fs';
import { convertToDashCase } from 'src/lib/strings/format';
import { exec } from 'src/lib/exec';
import { getNeevaCaps } from 'src/system-capabilities/neeva';
import { git } from 'src/lib/git';

let isInitialized = false;

export function rootDir(): Directory {
    const neeva = getNeevaCaps();
    if (!neeva.home) {
        throw new Error('NEEVA_REPO is not set');
    }

    return Directory.fromPath(neeva.home);
}

export async function init(): Promise<void> {
    const neeva = getNeevaCaps();
    if (!neeva.home) {
        throw new Error('NEEVA_REPO is not set');
    }

    if (!isInitialized) {
        // This will throw if the repo can't be initialized.
        await git().cwd(neeva.home);
        isInitialized = true;
    }
}

export async function isDirty(): Promise<boolean> {
    await init();
    return !(await git().status()).isClean();
}

export async function bailIfDirty(force?: boolean): Promise<void> {
    if (!force && (await isDirty())) {
        log.error(
            'Repo is dirty, cannot continue. Hint: use --force to override this check.'
        );
        process.exit(1);
    }
}

export async function currentBranchName(): Promise<string> {
    await init();
    return (await git().branch()).current;
}

export async function revParse(branch: string): Promise<string> {
    await init();
    return await git().revparse([branch]);
}

export async function isOnBranch(branch: string): Promise<boolean> {
    const currentBranch = await currentBranchName();
    return currentBranch === branch;
}

export async function bailIfNotBranch(
    branch: string,
    force?: boolean
): Promise<void> {
    const isCorrectBranch = await isOnBranch(branch);
    if (!force && !isCorrectBranch) {
        log.error(
            `You must be on the "${branch}" branch to continue. Hint: use --force to override this check.`
        );
        process.exit(1);
    }
}

export async function remoteBranchFullName(): Promise<string> {
    const branch = await currentBranchName();
    return `refs/heads/${branch}`;
}

export async function gitPushOrigin(): Promise<boolean> {
    await init();
    const remoteBranch = await remoteBranchFullName();
    const result = await git().push('origin', remoteBranch);
    return !!result.pushed.length;
}

export async function pull(branch: string): Promise<void> {
    await init();
    await git().fetch(`origin/${branch}`);
    await git().mergeFromTo(`origin/${branch}`, branch);
}

export async function fetchMaster(): Promise<void> {
    await init();
    await git().fetch('origin/master');
}

export async function isAncestor(
    ancestor: string,
    commit: string
): Promise<boolean> {
    const neeva = getNeevaCaps();
    if (!neeva.home) {
        throw new Error('NEEVA_REPO is not set');
    }
    const res = await exec(
        `git merge-base --is-ancestor ${ancestor} ${commit}`,
        {
            cwd: neeva.home,
        }
    );
    return res.exitCode === 0;
}

export async function checkoutBranch(name: string): Promise<void> {
    await init();
    await git().checkout(name);
}

export async function createBranchAndCheckout(name: string): Promise<void> {
    await init();
    await git().checkoutLocalBranch(name);
}

export async function getConfigValue(key: string): Promise<string> {
    await init();
    const config = await git().listConfig();
    const value = await config.all[key];

    if (typeof value === 'string') {
        return value;
    }

    if (value.length > 0 && typeof value[0] === 'string') {
        return value[0];
    }

    throw `Config value for ${key} is unknown`;
}

// returns a branch prefix based on user's name, as specified
// by the git repo config's user.name value
export async function getUserBranchPrefix(): Promise<string> {
    const userName = await getConfigValue('user.name');
    return convertToDashCase(userName);
}

// returns a branch name with user prefix
export async function calcBranchNameWithUserPrefix(
    branch: string
): Promise<string> {
    const prefix = await getUserBranchPrefix();
    return `${prefix}/${branch}`;
}
