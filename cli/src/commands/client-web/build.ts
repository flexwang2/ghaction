import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { buildDir, clean, yarnfg } from 'src/webui/module';

interface BuildCommandArgs extends Arguments {
    watch?: boolean;
    clean?: boolean;
}

export const BuildCommand: CommandModule<Arguments, BuildCommandArgs> = {
    command: 'build',
    describe: 'Build webui',
    builder: (yargs) => {
        return yargs.options({
            watch: {
                type: 'boolean',
                default: false,
                description: 'Watch and rebuild on changes',
            },
            clean: {
                type: 'boolean',
                default: false,
                description: 'Force a rebuild',
            },
        });
    },
    handler: async (argv): Promise<void> => {
        if (argv.clean) {
            log.info(`Cleaning ${buildDir().toString()}...`);
            const res = await clean();
            if (res?.error) {
                log.error(res.stderr);
                process.exit(1);
            }
        }

        if (argv.watch) {
            yarnfg('dev');
        } else {
            yarnfg('build');
        }
    },
};
