import { getNeevaCaps } from 'src/system-capabilities/neeva';
import simpleGit, { SimpleGit } from 'simple-git';

let cachedGit: SimpleGit | undefined;

export function git(): SimpleGit {
    if (!cachedGit) {
        cachedGit = simpleGit();
        const neeva = getNeevaCaps();
        if (!neeva.home) {
            throw 'NEEVA_REPO is not defined.';
        }
        cachedGit.cwd(neeva.home);
    }
    return cachedGit;
}

// Returns true if the current Neeva repo is dirty. Requires that git be
// initialized before this is called.
export async function isRepoDirty(): Promise<boolean> {
    const status = await git().status();
    return !status.isClean();
}
