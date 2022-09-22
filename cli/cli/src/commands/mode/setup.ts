import * as log from 'src/lib/log';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { ConfigDir, PasswordFile, TokenFile } from 'src/mode/config';
import { getCurrentUser } from 'src/mode/auth';

export const SetupCommand: CommandModule<Arguments, Arguments> = {
    command: 'setup',
    describe: 'Setup Mode access credentials',
    handler: async (): Promise<void> => {
        if (!ConfigDir().exists()) {
            log.info(`Creating ${ConfigDir().path}`);
            ConfigDir().mkdirp();
        }

        if (TokenFile().exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `Mode token file: (${TokenFile().path}) exists. Re-create?`,
                    false
                ))
            ) {
                process.exit(0);
            }
        }

        if (PasswordFile().exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `Mode password file: (${
                        PasswordFile().path
                    }) exists. Re-create?`,
                    false
                ))
            ) {
                process.exit(0);
            }
        }

        log.highlight(
            `To generate your mode API token and password, please see: https://mode.com/help/articles/api-reference/`
        );
        const token = await stdio.readValue({
            instruction: 'Token: ',
            validation: {
                validate: (v: string): boolean => v.trim().length > 10,
                errorMsg: 'You must provide a valid token',
            },
            transformation: (v: string): string => v.trim(),
        });
        const password = await stdio.readValue({
            instruction: 'Password: ',
            validation: {
                validate: (v: string): boolean => v.trim().length > 10,
                errorMsg: 'You must provide a valid password',
            },
            transformation: (v: string): string => v.trim(),
        });

        TokenFile().write(token);
        log.info(`Wrote ${TokenFile().path}`);
        PasswordFile().write(password);
        log.info(`Wrote ${PasswordFile().path}`);

        // Validate token and password
        const user = await getCurrentUser();
        if (user !== null) {
            log.success(`Authenticated to Mode as ${user}.`);
            process.exit(0);
        }
        log.error(
            'Mode authentication falied. Please re-run `nva mode setup`.'
        );
        process.exit(0);
    },
};
