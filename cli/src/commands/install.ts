import * as log from 'src/lib/log';
import * as stdio from 'src/lib/stdio';
import * as yargs from 'yargs';
import { Arguments } from 'src/arguments';
import { createUsrLocalBinSymlink } from 'src/install';
import { usrLocalBinNeeva } from 'src/install/usr-local';

export const InstallCommand: yargs.CommandModule<Arguments, Arguments> = {
    command: 'install',
    describe: `Install Neeva CLI tool in ${usrLocalBinNeeva().path}`,
    builder: (yargs): typeof yargs => {
        return yargs;
    },
    handler: async (): Promise<void> => {
        if (usrLocalBinNeeva().exists()) {
            if (
                !(await stdio.yesNoPrompt(
                    `Neeva CLI tool is already installed. Overwrite?`,
                    false
                ))
            ) {
                process.exit(0);
            }
        }

        try {
            await createUsrLocalBinSymlink();
        } catch (err) {
            log.error(
                `Unable to create symlink for Neeva CLI tool in ${
                    usrLocalBinNeeva().path
                }`
            );
            log.out(err.message);
            process.exit(1);
        }

        log.success(`Success! Wrote ${usrLocalBinNeeva().path}`);
    },
};
