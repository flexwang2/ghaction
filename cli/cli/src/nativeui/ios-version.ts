import * as nativeui from 'src/nativeui/module';
import { exec } from 'src/lib/exec';
import { getSystemCaps } from 'src/system-capabilities/system';
import semver from 'semver';

async function agvtool(...args: string[]): Promise<string | null> {
    const caps = await getSystemCaps();
    if (caps.xcode.agvtool && nativeui.iosDir().exists()) {
        const { exitCode, stdout } = await exec(`agvtool ${args.join(' ')}`, {
            cwd: nativeui.iosDir().toString(),
        });
        if (exitCode === 0) {
            return stdout?.trim() ?? null;
        }
    }
    return null;
}

export async function getIosMarketingVersion(): Promise<string | null> {
    return agvtool('what-marketing-version', '-terse1');
}

export async function getIosMarketingVersionAsSemver(): Promise<semver.SemVer | null> {
    const v = await getIosMarketingVersion();
    return semver.parse(v);
}

export async function getIosBuildNumber(): Promise<number | null> {
    const build = await agvtool('what-version', '-terse');
    if (typeof build === 'string' && build.length) {
        return parseInt(build, 10);
    }
    return null;
}

export async function getIosFullVersion(): Promise<string | null> {
    const mkt = await getIosMarketingVersion();
    const build = await getIosBuildNumber();

    if (mkt && build) {
        return `${mkt}-${build}`;
    } else {
        return null;
    }
}

export async function setIosMarketingVersion(
    ver: string
): Promise<string | null> {
    return agvtool(`new-marketing-version`, ver);
}

export async function setIosBuildNumber(
    build: string | number
): Promise<string | null> {
    return agvtool(`new-version`, build.toString());
}
