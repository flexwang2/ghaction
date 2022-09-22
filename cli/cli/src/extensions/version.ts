import * as semver from 'semver';
import { Directory } from 'src/lib/fs/directory';
import { packageJSON } from './module';

export function getVersion(rootDir: Directory): string | null {
    const pjson = packageJSON(rootDir);
    if (pjson.exists()) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { version } = require(pjson.path);
        return version;
    }
    return null;
}

export function getChromeExtensionFullVersion(
    rootDir: Directory
): semver.SemVer | null {
    return semver.parse(getVersion(rootDir));
}
