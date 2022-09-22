import * as log from 'src/lib/log';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { ConfigDir, TokenFile } from 'src/github/config';
import { getCurrentUser, getHasNeevaOrgAccess } from 'src/github/auth';

export const SetupCommand: CommandModule<Arguments, Arguments> = {
    command: 'setup',
    describe: 'Setup Github access credentials',
    handler: async (): Promise<void> => {
        if (!ConfigDir().exists()) {
            log.info(`Creating ${ConfigDir().path}`);
            ConfigDir().mkdirp();
        }

        if (TokenFile().exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `Github token file (${
                        TokenFile().path
                    }) exists. Re-create?`,
                    false
                ))
            ) {
                process.exit(0);
            }
        }

        log.highlight(
            `Configure Github authorization
  1. Login to Github.com in your browser
  2. Click Settings -> Developer settings
  3. Click Personal access tokens
  4. Create a new token, give it a name, select access to repo scope, and click Generate
  5. Copy the token value
  6. For the token you just created, select "Enable SSO" to give it access to the Neevaco organization
        `
        );
        const token = await stdio.readValue({
            instruction: 'Personal access token: ',
            validation: {
                validate: (v: string): boolean => v.trim().length > 10,
                errorMsg: 'You must provide a valid token',
            },
            transformation: (v: string): string => v.trim(),
        });

        TokenFile().write(token);
        log.info(`Wrote ${TokenFile().path}`);

        // Validate token
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
