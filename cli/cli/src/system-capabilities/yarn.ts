import * as semver from 'semver';
import { SystemCaps } from './types';
import { exec } from 'src/lib/exec';

export async function getYarnCaps(): Promise<SystemCaps['yarn']> {
    const raw = (await exec('yarn -v --silent')).stdout?.trim() ?? '';
    const version = semver.parse(raw);

    return {
        version: {
            raw,
            major: version?.major ?? 0,
            minor: version?.minor ?? 0,
            patch: version?.patch ?? 0,
        },
    };
}
