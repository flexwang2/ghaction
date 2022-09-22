import * as repo from 'src/repo';
import { Directory, File } from 'src/lib/fs';
import { ExecResult, exec } from 'src/lib/exec';
import { getSystemCaps } from 'src/system-capabilities/system';

export function rootDir(): Directory {
    return repo.rootDir().dir('client', 'packages', 'neeva-lib');
}

export function srcDir(): Directory {
    return rootDir().dir('src');
}

export function distDir(): Directory {
    return rootDir().dir('dist');
}

export function lastCompileTimeFile(): File {
    return distDir().file('.lastcompiletime');
}

export function lastCompileHashFile(): File {
    return distDir().file('.lastcompilehash');
}

export async function clean(): Promise<ExecResult | null> {
    const dist = distDir();
    if (dist.exists()) {
        return dist.rm();
    } else {
        return null;
    }
}

export function packageJSON(): File {
    return rootDir().file('package.json');
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
