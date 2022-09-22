import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { buildDir, clean, makefg } from 'src/extensions/module';

interface BuildCommandArgs extends Arguments {
    watchChrome?: boolean;
    watchEdge?: boolean;
    watchFirefox?: boolean;
    releaseChromeM1?: boolean;
    releaseChrome?: boolean;
    releaseEdgeM1?: boolean;
    releaseEdge?: boolean;
    releaseFirefox?: boolean;
    releaseSafari?: boolean;
    releaseTrackingPrevention?: boolean;
    releaseChromeNoTrackingPrevention?: boolean;
    clean?: boolean;
}

export const BuildCommand: CommandModule<Arguments, BuildCommandArgs> = {
    command: 'build',
    describe: 'Build extension',
    builder: (yargs) => {
        return yargs.options({
            watchChrome: {
                type: 'boolean',
                default: false,
                description: 'Watch chrome extension and rebuild on changes',
            },
            watchEdge: {
                type: 'boolean',
                default: false,
                description: 'Watch edge and rebuild on changes',
            },
            watchFirefox: {
                type: 'boolean',
                default: false,
                description: 'Watch firefox and rebuild on changes',
            },
            releaseChromeM1: {
                type: 'boolean',
                default: false,
                description: 'Release Chrome with M1',
            },
            releaseChrome: {
                type: 'boolean',
                default: false,
                description: 'Release Chrome',
            },
            releaseEdgeM1: {
                type: 'boolean',
                default: false,
                description: 'Release Edge M1',
            },
            releaseEdge: {
                type: 'boolean',
                default: false,
                description: 'Release Edge',
            },
            releaseFirefox: {
                type: 'boolean',
                default: false,
                description: 'Release Firefox',
            },
            releaseSafari: {
                type: 'boolean',
                default: false,
                description: 'Release Safari with',
            },
            releaseTrackingPrevention: {
                type: 'boolean',
                default: false,
                description: 'Release Chrome tracking prevention',
            },
            releaseChromeNoTrackingPrevention: {
                type: 'boolean',
                default: false,
                description: 'Release Chrome without tracking prevention',
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

        if (argv.watchChrome) {
            makefg('dev');
        } else if (argv.watchEdge) {
            makefg('dev-edge');
        } else if (argv.watchFirefox) {
            makefg('dev-firefox');
        } else if (argv.releaseChromeM1) {
            makefg('release-m1-search');
        } else if (argv.releaseChrome) {
            makefg('release');
        } else if (argv.releaseEdgeM1) {
            makefg('release-edge-m1-search');
        } else if (argv.releaseEdge) {
            makefg('release-edge');
        } else if (argv.releaseFirefox) {
            makefg('release-firefox');
        } else if (argv.releaseSafari) {
            makefg('release-safari');
        } else if (argv.releaseTrackingPrevention) {
            makefg('release-tracking-prevention');
        } else if (argv.releaseChromeNoTrackingPrevention) {
            makefg('release-neeva-extension');
        } else {
            makefg('build');
        }
    },
};
