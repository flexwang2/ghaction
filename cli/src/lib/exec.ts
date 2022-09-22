import {
    ChildProcess,
    ExecOptions,
    SpawnOptions,
    exec as cpExec,
    spawn,
} from 'child_process';
import { safeSplit } from './strings';

export interface ExecResult {
    cmd: string;
    error: Error | null;
    exitCode: number | null;
    stderr: string | null;
    stdout: string | null;
}

export function exec(
    cmd: string | string[],
    options: ExecOptions = {}
): Promise<ExecResult> {
    let strCmd: string;

    if (Array.isArray(cmd)) {
        strCmd = cmd.join(' && ');
    } else {
        strCmd = cmd;
    }

    return new Promise<ExecResult>((resolve: (r: ExecResult) => void) => {
        cpExec(strCmd, options, (error, stdout, stderr): void => {
            const result: ExecResult = {
                cmd: strCmd,
                error,
                stdout,
                stderr,
                exitCode: error?.code ?? 0,
            };

            resolve(result);
        });
    });
}

// Execute a command and keep the process in the foreground
export function execfg(
    cmd: string | string[],
    options: SpawnOptions = {}
): Promise<ExecResult> {
    let prg: string;
    let args: string[];

    if (!Array.isArray(cmd)) {
        const split = safeSplit(cmd);
        prg = split[0];
        args = split.slice(1);
    } else {
        prg = cmd[0];
        args = cmd.slice(1);
    }

    if (!options.stdio) {
        options.stdio = 'inherit';
    }

    return new Promise<ExecResult>((resolve: (r: ExecResult) => void) => {
        const child = spawn(prg, args, options);

        const result: ExecResult = {
            cmd: [cmd].join(' '),
            error: null,
            stdout: null,
            stderr: null,
            exitCode: null,
        };

        child.on('error', (err: Error) => {
            result.error = err;
            result.exitCode = 99;
            resolve(result);
        });

        child.on('exit', (code: number) => {
            result.error = new Error(`Process exited with code ${code}`);
            result.exitCode = code;
            resolve(result);
        });
    });
}

// Execute a command in a background process
export const execbg = (
    cmd: string | string[],
    options: SpawnOptions = {}
): ChildProcess => {
    let prg: string;
    let args: string[];

    if (!Array.isArray(cmd)) {
        const split = safeSplit(cmd);
        prg = split[0];
        args = split.slice(1);
    } else {
        prg = cmd[0];
        args = cmd.slice(1);
    }

    return spawn(prg, args, options);
};

export function assertExecSuccess(result: ExecResult): void {
    if (result.error) {
        throw new Error(
            `Error executing command: ${result.cmd}\n${result.stdout}\n${result.stderr}`
        );
    }
}
