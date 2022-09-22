import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import {
    PublishChrome,
    PublishChromeM1,
    PublishChromePreRelease,
    PublishNeevaCookieCutterForChrome,
    PublishNeevaCookieCutterForChromePreRelease,
    PublishNeevaForChromeNoTrackingPrevention,
    PublishNeevaForChromeNoTrackingPreventionPreRelease,
    PublishTrackingPrevention,
    getAppKey,
    getAppSecret,
    getRefreshToken,
} from 'src/extensions';
import { buildDir, clean, makefg } from 'src/extensions/module';

interface PublishCommandArgs extends Arguments {
    publishChromeM1?: boolean;
    publishChrome?: boolean;
    publishChromeTrackingPrevention?: boolean;
    publishChromeNoTrackingPrevention?: boolean;
    publishChromePreRelease?: boolean;
    publishChromeNoTrackingPreventionPreRelease?: boolean;
    publishChromeCookieCutter?: boolean;
    publishChromeCookieCutterPreRelease?: boolean;
}

function printAccessCommands(): void {
    log.error(
        'eval $(go run neeva.co/cmd/prodaccess aws shell --eval) && eval $(go run neeva.co/cmd/chromewebstore getsecrets)'
    );
}

async function buildAndPublish(
    makeTarget: string,
    publishFunction: () => Promise<boolean>
): Promise<boolean> {
    if (!(getRefreshToken() && getAppKey() && getAppSecret())) {
        log.error(
            'Authentication parameters required for accessing chrome webstore are not present'
        );
        printAccessCommands();
        return false;
    }
    const result = await makefg(makeTarget);
    if (result?.exitCode === 0) {
        try {
            const status = await publishFunction();
            if (!status) {
                log.error('Publish extension failed');
            }
        } catch (e) {
            log.error(
                'Publish extension failed. Did you forgot to run following commands?.'
            );
            printAccessCommands();
            log.error('Exception thrown: ', e);
        }
    }

    return false;
}

export const PublishCommand: CommandModule<Arguments, PublishCommandArgs> = {
    command: 'publish',
    describe: 'Publish extension to app store',
    builder: (yargs) => {
        return yargs
            .options({
                publishChromeM1: {
                    type: 'boolean',
                    default: false,
                    description: 'Publish Chrome M1',
                },
                publishChrome: {
                    type: 'boolean',
                    default: false,
                    description: 'Publish Chrome Alpha',
                },
                publishChromeTrackingPrevention: {
                    type: 'boolean',
                    default: false,
                    description: 'Publish Chrome tracking prevention extension',
                },
                publishChromeNoTrackingPrevention: {
                    type: 'boolean',
                    default: false,
                    description:
                        'Publish Chrome extension with no tracking prevention',
                },
                publishChromePreRelease: {
                    type: 'boolean',
                    default: false,
                    description: 'Publish Neeva For Chrome Pre-release',
                },
                publishChromeNoTrackingPreventionPreRelease: {
                    type: 'boolean',
                    default: false,
                    description:
                        'Publish Chrome extension with no tracking prevention Pre-release',
                },
                publishChromeCookieCutter: {
                    type: 'boolean',
                    default: false,
                    description: 'Publish Neeva For Chrome Cookie cutter',
                },
                publishChromeCookieCutterPreRelease: {
                    type: 'boolean',
                    default: false,
                    description:
                        'Publish Neeva For Chrome Cookie cutter Pre-release',
                },
            })
            .check((argv): boolean => {
                // Require one and only one option
                const opts: Array<keyof PublishCommandArgs> = [
                    'publishChrome',
                    'publishChromeM1',
                    'publishChromeNoTrackingPrevention',
                    'publishChromeTrackingPrevention',
                    'publishChromePreRelease',
                    'publishChromeNoTrackingPreventionPreRelease',
                    'publishChromeCookieCutter',
                    'publishChromeCookieCutterPreRelease',
                ];
                const setOpts = opts.reduce((accu, o): string[] => {
                    if (argv[o]) {
                        accu.push(o);
                    }
                    return accu;
                }, [] as string[]);
                if (setOpts.length === 0) {
                    throw new Error(
                        'Missing publish option. Please run with --help flag for more information.'
                    );
                }
                if (setOpts.length > 1) {
                    throw new Error(
                        `Only one publish option is allowed. Found ${
                            setOpts.length
                        }: ${setOpts.join(', ')}`
                    );
                }
                return true;
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

        if (argv.publishChromeM1) {
            buildAndPublish('release-m1-search', PublishChromeM1);
        } else if (argv.publishChrome) {
            buildAndPublish('release', PublishChrome);
        } else if (argv.publishChromeTrackingPrevention) {
            buildAndPublish(
                'release-tracking-prevention',
                PublishTrackingPrevention
            );
        } else if (argv.publishChromeNoTrackingPrevention) {
            buildAndPublish(
                'release-no-tracking-prevention',
                PublishNeevaForChromeNoTrackingPrevention
            );
        } else if (argv.publishChromePreRelease) {
            buildAndPublish('release-canary', PublishChromePreRelease);
        } else if (argv.publishChromeNoTrackingPreventionPreRelease) {
            buildAndPublish(
                'release-no-tracking-prevention-canary',
                PublishNeevaForChromeNoTrackingPreventionPreRelease
            );
        } else if (argv.publishChromeCookieCutter) {
            buildAndPublish(
                'release-cookie-cutter',
                PublishNeevaCookieCutterForChrome
            );
        } else if (argv.publishChromeCookieCutterPreRelease) {
            buildAndPublish(
                'release-cookie-cutter-canary',
                PublishNeevaCookieCutterForChromePreRelease
            );
        }
    },
};
