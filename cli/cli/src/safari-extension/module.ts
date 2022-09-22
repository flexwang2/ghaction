import * as repo from 'src/repo';
import { Directory, File } from 'src/lib/fs';
import { ExecResult, exec } from 'src/lib/exec';
import { getSystemCaps } from 'src/system-capabilities/system';

export function rootDir(): Directory {
    return repo.rootDir().dir('client', 'extension', 'NeevaForSafari');
}

export function packageJSON(): File {
    return rootDir().file('package.json');
}

export function neevaForSafari(): Directory {
    return rootDir().dir('ios');
}

export async function yarn(...args: string[]): Promise<ExecResult | null> {
    let result: ExecResult | null = null;
    const caps = await getSystemCaps();
    if (caps.yarn.version && rootDir().exists()) {
        result = await exec(`yarn ${args.join(' ')}`, {
            cwd: rootDir().toString(),
        });
    }
    return result;
}
