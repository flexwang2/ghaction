import * as semver from 'semver';
import { SystemCaps } from './types';

export function getNodeCaps(): SystemCaps['node'] {
    const version = semver.parse(process.version);

    return {
        version: {
            raw: process.version,
            major: version?.major ?? 0,
            minor: version?.minor ?? 0,
            patch: version?.patch ?? 0,
        },
        process: {
            versions: process.versions,
            execPath: process.execPath,
        },
    };
}
