import * as log from 'src/lib/log';
import * as yargs from 'yargs';
import { Arguments } from 'src/arguments';
import { usrLocalBinNeeva } from 'src/install/usr-local';

export const UninstallCommand: yargs.CommandModule<Arguments, Arguments> = {
    command: 'uninstall',
    describe: `Delete ${usrLocalBinNeeva().path}`,
    builder: (yargs): typeof yargs => {
        return yargs;
    },
    handler: async (): Promise<void> => {
        if (!usrLocalBinNeeva().exists()) {
            log.info(`${usrLocalBinNeeva().path} not found.`);
            process.exit(0);
        }

        try {
            await usrLocalBinNeeva().rm();
        } catch (err) {
            log.error(
                `Unable to delete symlink for Neeva CLI tool in ${
                    usrLocalBinNeeva().path
                }`
            );
            log.out(err.message);
            process.exit(1);
        }

        log.success(`Success! Deleted ${usrLocalBinNeeva().path}`);
    },
};
