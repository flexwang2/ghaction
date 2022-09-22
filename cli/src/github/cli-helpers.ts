import * as log from 'src/lib/log';
import { getCurrentUser, getHasNeevaOrgAccess } from 'src/github/auth';

export async function mustHaveGithubAccess(): Promise<void> {
    const user = await getCurrentUser();
    const hasNeevaOrgAccess = await getHasNeevaOrgAccess();

    if (hasNeevaOrgAccess && user !== null) {
        // Success
        return;
    } else if (!hasNeevaOrgAccess && user !== null) {
        log.error(
            `Authenticated as ${user}, but cannot access the neevaco organization. Please ensure your token has been granted the proper permission. Check https://paper.dropbox.com/doc/How-to-using-Neeva-CLI--A_zkubJRmB7EQu~S8VPoTZGZAg-9AbYG7drsIH9g4YFP2quQ for help.`
        );
        process.exit(0);
    } else if (user === null) {
        log.error(
            'Github authentication falied. Please re-run `nva github setup`.'
        );
        process.exit(0);
    } else {
        // unknown error
        log.error('Invalid state, exiting now');
        process.exit(1);
    }
}
