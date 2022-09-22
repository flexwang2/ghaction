import { ExecResult, exec } from 'src/lib/exec';

// rm -rf functionality
export function rmdir(path: string): Promise<ExecResult> {
    return exec(`rm -rf ${path}`);
}
