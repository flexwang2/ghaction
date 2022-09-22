import * as repo from 'src/repo';
import { Directory, File } from 'src/lib/fs';
import { ExecResult, exec, execfg } from 'src/lib/exec';
import { getSystemCaps } from 'src/system-capabilities/system';

export function rootDir(): Directory {
    return repo.rootDir().dir('client', 'webui');
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

export async function yarnfg(...args: string[]): Promise<ExecResult | null> {
    let result: ExecResult | null = null;
    const caps = await getSystemCaps();
    if (caps.yarn.version && rootDir().exists()) {
        result = await execfg(`yarn ${args.join(' ')}`, {
            cwd: rootDir().toString(),
        });
    }
    return result;
}
