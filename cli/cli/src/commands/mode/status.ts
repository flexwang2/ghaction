import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { getCurrentUser } from 'src/mode/auth';

export const StatusCommand: CommandModule<Arguments, Arguments> = {
    command: 'status',
    describe: 'Check Mode auth status',
    handler: async (): Promise<void> => {
        const user = await getCurrentUser();

        if (user) {
            log.success(`Authenticated to Mode as ${user}.`);
            process.exit(0);
        }
        log.error(
            'Mode authentication falied. Please re-run `nva mode setup`.'
        );
        process.exit(1);
    },
};
