import * as fs from 'fs';
import * as log from 'src/lib/log';
import { Directory } from 'src/lib/fs';
import { getChromeExtensionFullVersion } from './version';
import { rootDir } from './module';
import chromeWebstoreUpload from 'chrome-webstore-upload';
interface ExtensionDetails {
    id: string;
    fileName: string;
    searchDomain: string;
    target: string;
    rootDir?: string;
}

export const extensionDetails: { [key: string]: ExtensionDetails } = {
    NeevaForChromeM1: {
        id: 'mfnibonhmmbockkmppofojpbbcnamkkp',
        fileName: 'neeva-extension-m1',
        searchDomain: 'm1.neeva.com',
        target: 'trustedTesters',
    },
    NeevaForChrome: {
        id: 'aookogakccicaoigoofnnmeclkignpdk',
        fileName: 'neeva-extension-',
        searchDomain: 'neeva.com',
        target: 'default',
    },
    NeevaForChromeNoTrackingPrevention: {
        id: 'bdifechcjcejkaigiikdammjjmoinode',
        fileName: 'neeva-extension-no-tracking-prevention',
        searchDomain: 'neeva.com',
        target: 'default',
    },
    NeevaForChromePreRelease: {
        id: 'eeajgjacgglfpncplonfphekbpdbkfeg',
        fileName: 'neeva-extension-',
        searchDomain: 'neeva.com',
        target: 'trustedTesters',
    },
    NeevaForChromeNoTrackingPreventionPreRelease: {
        id: 'fdgophbibhdckbipcpfegknpnegaimef',
        fileName: 'neeva-extension-no-tracking-prevention',
        searchDomain: 'neeva.com',
        target: 'trustedTesters',
    },
    NeevaCookieCutterForChromePreRelease: {
        id: 'jdkpclaodkalkcobglkkdgdejgbpeglm',
        fileName: 'neeva-protect-extension-Internal',
        searchDomain: '',
        target: 'trustedTesters',
        rootDir: 'magpie/',
    },
    NeevaCookieCutterForChrome: {
        id: 'idcnmiefjmnabbchggljinkeiinlolon',
        fileName: 'neeva-protect-extension-',
        searchDomain: '',
        target: 'default',
        rootDir: 'magpie/',
    },
};

export function getAppKey(): string | undefined {
    return process.env.NEEVA_CHROME_WEBSTORE_APP_KEY;
}

export function getAppSecret(): string | undefined {
    return process.env.NEEVA_CHROME_WEBSTORE_APP_SECRET;
}

export function getRefreshToken(): string | undefined {
    return process.env.NEEVA_CHROME_WEBSTORE_REFRESH_TOKEN;
}

function getChromeWebstoreClient(extensionId: string): any {
    return chromeWebstoreUpload({
        extensionId,
        clientId: getAppKey(),
        clientSecret: getAppSecret(),
        refreshToken: getRefreshToken(),
    });
}

export function getProjectRoot(extension: ExtensionDetails): Directory {
    if (extension.rootDir) {
        return rootDir().dir(`${extension.rootDir}/`);
    }
    return rootDir();
}

function getBuildRoot(extension: ExtensionDetails): Directory {
    return getProjectRoot(extension).dir(`build`);
}

function manifestFileSanityTest(extension: ExtensionDetails): boolean {
    if (!extension.searchDomain) {
        log.info('Extension is not expected to have search domain');
        return true;
    }

    const manifestFilePath = `${getBuildRoot(extension)}/manifest.json`;
    const manifestData = fs.readFileSync(manifestFilePath);
    const manifest = JSON.parse(manifestData.toString());
    if (!manifest) {
        log.error('Error reading manifest file for sanity check');
        return false;
    }
    const searchUrl =
        manifest.chrome_settings_overrides?.search_provider?.search_url;
    const suggestUrl =
        manifest.chrome_settings_overrides?.search_provider.suggest_url;
    const prefix = `https://${extension.searchDomain}/`;
    if (
        searchUrl &&
        searchUrl.indexOf(prefix) === 0 &&
        suggestUrl &&
        suggestUrl.indexOf(prefix) === 0
    ) {
        return true;
    }
    log.info(
        'Sanity test for extension failed. Extension :',
        JSON.stringify(extension),
        ', search url: ',
        searchUrl,
        '. suggest url: ',
        suggestUrl
    );
    return false;
}

async function publishExtension(extension: ExtensionDetails): Promise<boolean> {
    if (!manifestFileSanityTest(extension)) {
        return false;
    }
    const webstoreClient = getChromeWebstoreClient(extension.id);
    const fullFilePath = `${getBuildRoot(extension)}/${
        extension.fileName
    }-${getChromeExtensionFullVersion(getProjectRoot(extension))}.zip`;

    const zipFile = fs.createReadStream(fullFilePath);
    // https://developer.chrome.com/webstore/webstore_api/items/update
    const uploadResults = await webstoreClient.uploadExisting(zipFile);

    if (uploadResults.itemError || uploadResults.uploadState !== 'SUCCESS') {
        log.error('Upload did not succeed: ', JSON.stringify(uploadResults));
        return false;
    }
    log.info('Uploaded extension successfully ');

    // https://developer.chrome.com/webstore/webstore_api/items/publish
    try {
        const publishResults = await webstoreClient.publish(extension.target);
        if (publishResults.status) {
            if (
                publishResults.length === 1 &&
                publishResults[0] === 'PUBLISHED_WITH_FRICTION_WARNING'
            ) {
                log.info(
                    'Delay expected to publish. Reason: ',
                    publishResults.statusDetails[0]
                );
                return true;
            }
            if (publishResults.length > 0) {
                log.info(
                    'Publish failed. Code(s):',
                    publishResults.status,
                    publishResults.statusDetails
                );
                return false;
            }
        }
    } catch (e) {
        // TODO (rajaram): Identify why chrome web store API
        // not detect that we own neeva.co and fix.
        // Clean up following log messages when done.
        log.error('Publishing throws exception.');
        log.error(
            'Chrome Web Store may be incorrectly throwing error about domain ownership.'
        );
        log.error(
            'Open dashboard ( https://chrome.google.com/webstore/devconsole/ ) and press submit already added extension manually.'
        );
        log.error('Contact #dev-extension or on slack for any help.');
        log.error('Error thrown: ', e);
        return false;
    }
    log.info('Publish extension successfully ');
    return true;
}

export async function PublishChromeM1(): Promise<boolean> {
    return publishExtension(extensionDetails.NeevaForChromeM1);
}

export async function PublishChromePreRelease(): Promise<boolean> {
    return publishExtension(extensionDetails.NeevaForChromePreRelease);
}

export async function PublishChrome(): Promise<boolean> {
    return publishExtension(extensionDetails.NeevaForChrome);
}

export async function PublishTrackingPrevention(): Promise<boolean> {
    return publishExtension(extensionDetails.TrackingPrevention);
}

export async function PublishNeevaForChromeNoTrackingPrevention(): Promise<
    boolean
> {
    return publishExtension(
        extensionDetails.NeevaForChromeNoTrackingPrevention
    );
}

export async function PublishNeevaForChromeNoTrackingPreventionPreRelease(): Promise<
    boolean
> {
    return publishExtension(
        extensionDetails.NeevaForChromeNoTrackingPreventionPreRelease
    );
}

export async function PublishNeevaCookieCutterForChromePreRelease(): Promise<
    boolean
> {
    return publishExtension(
        extensionDetails.NeevaCookieCutterForChromePreRelease
    );
}

export async function PublishNeevaCookieCutterForChrome(): Promise<boolean> {
    return publishExtension(extensionDetails.NeevaCookieCutterForChrome);
}
