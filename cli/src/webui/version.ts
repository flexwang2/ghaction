import * as semver from 'semver';
import { packageJSON, yarn } from './module';

export function getVersion(): string | null {
    const pjson = packageJSON();
    if (pjson.exists()) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { version } = require(pjson.path);
        return version;
    }
    return null;
}

export function getVersionAsSemVer(): semver.SemVer | null {
    return semver.parse(getVersion());
}

export async function bumpMajorVersion(): Promise<boolean> {
    const result = await yarn('version', '--major', '--no-git-tag-version');
    return result?.exitCode === 0;
}

export async function bumpMinorVersion(): Promise<boolean> {
    const result = await yarn('version', '--minor', '--no-git-tag-version');
    return result?.exitCode === 0;
}

export async function bumpPatchVersion(): Promise<boolean> {
    const result = await yarn('version', '--patch', '--no-git-tag-version');
    return result?.exitCode === 0;
}

export async function setVersion(ver: string): Promise<boolean> {
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
