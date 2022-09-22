import * as semver from 'semver';
import { packageJSON, yarn } from './module';

export function getPackageJSONVersion(): string | null {
    const pjson = packageJSON();
    if (pjson.exists()) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { version } = require(pjson.path);
        return version;
    }
    return null;
}

export async function setPackageJSONVersion(ver: string): Promise<boolean> {
    const parsed = semver.parse(ver);
    let success = false;
    if (parsed) {
        const result = await yarn(
            'version',
            '--new-version',
            parsed.format(),
            '--no-git-tag-version'
        );
        success = result?.exitCode === 0;
    }
    return success;
}
