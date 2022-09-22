import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { getCurrentUser, getHasNeevaOrgAccess } from 'src/github/auth';

export const StatusCommand: CommandModule<Arguments, Arguments> = {
    command: 'status',
    describe: 'Check Github auth status',
    handler: async (): Promise<void> => {
        const user = await getCurrentUser();
        const hasNeevaOrgAccess = await getHasNeevaOrgAccess();

        if (hasNeevaOrgAccess && user !== null) {
            log.success(
                `Authenticated as ${user} with access to the neevaco organization.`
            );
            process.exit(1);
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
    },
};
