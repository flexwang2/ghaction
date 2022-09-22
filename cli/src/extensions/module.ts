import * as repo from 'src/repo';
import { Directory, File } from 'src/lib/fs';
import { ExecResult, execfg } from 'src/lib/exec';
import { getSystemCaps } from 'src/system-capabilities/system';

export function rootDir(): Directory {
    return repo.rootDir().dir('client', 'extension');
}

export function srcDir(): Directory {
    return rootDir().dir('src');
}

export function buildDir(): Directory {
    return rootDir().dir('build');
}

export function nodeModulesDir(): Directory {
    return rootDir().dir('node_modules');
}

export async function clean(): Promise<ExecResult | null> {
    const build = buildDir();
    if (build.exists()) {
        return build.rm();
    } else {
        return null;
    }
}

export function packageJSON(rootDir: Directory): File {
    return rootDir.file('package.json');
}

export async function makefg(...args: string[]): Promise<ExecResult | null> {
    let result: ExecResult | null = null;
    const caps = await getSystemCaps();

    if (caps.yarn.version && rootDir().exists()) {
        result = await execfg(`make ${args.join(' ')}`, {
            cwd: rootDir().toString(),
        });
    }
    return result;
}
