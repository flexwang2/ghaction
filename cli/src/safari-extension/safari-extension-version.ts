import * as safariExtension from 'src/safari-extension/module';
import { exec } from 'src/lib/exec';
import { getSystemCaps } from 'src/system-capabilities/system';
import semver from 'semver';

async function agvtool(...args: string[]): Promise<string | null> {
    const caps = await getSystemCaps();
    if (caps.xcode.agvtool && safariExtension.rootDir().exists()) {
        const { exitCode, stdout } = await exec(`agvtool ${args.join(' ')}`, {
            cwd: safariExtension.rootDir().toString(),
        });
        if (exitCode === 0) {
            return stdout?.trim() ?? null;
        }
    }
    return null;
}

export async function getSafariExtensionMarketingVersion(): Promise<
    string | null
> {
    return agvtool('what-marketing-version', '-terse1');
}

export async function getSafariExtensionMarketingVersionAsSemver(): Promise<semver.SemVer | null> {
    const v = await getSafariExtensionMarketingVersion();
    return semver.parse(v);
}

export async function getSafariExtensionBuildNumber(): Promise<number | null> {
    const build = await agvtool('what-version', '-terse');
    if (typeof build === 'string' && build.length) {
        return parseInt(build, 10);
    }
    return null;
}

export async function getSafariExtensionFullVersion(): Promise<string | null> {
    const mkt = await getSafariExtensionMarketingVersion();
    const build = await getSafariExtensionBuildNumber();

    if (mkt && build) {
        return `${mkt}-${build}`;
    } else {
        return null;
    }
}

export async function setSafariExtensionMarketingVersion(
    ver: string
): Promise<string | null> {
    return agvtool(`new-marketing-version`, ver);
}

export async function setSafariExtensionBuildNumber(
    build: string | number
): Promise<string | null> {
    return agvtool(`new-version`, build.toString());
}
