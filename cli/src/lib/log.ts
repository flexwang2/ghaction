/* eslint-disable no-console */
import { Arguments } from 'src/arguments';
import chalk from 'chalk';

enum LogLevel {
    All = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

let level = LogLevel.All;

export function error(...message: any[]): void {
    if (level <= LogLevel.Error) {
        console.error(chalk.red('[ERROR]', ...message));
    }
}

export function warn(...message: any[]): void {
    if (level <= LogLevel.Warn) {
        console.warn(chalk.yellow('[WARN]', ...message));
    }
}

export function info(...message: any[]): void {
    if (level <= LogLevel.Info) {
        console.info(chalk.white('[INFO]', ...message));
    }
}

export function success(...message: any[]): void {
    // Treat success like info.
    if (level <= LogLevel.Info) {
        console.log(chalk.green('[SUCCESS]', ...message));
    }
}

export type Color = 'red' | 'green' | 'white';

export function color(color: Color, ...message: any[]): void {
    let c = chalk.white;
    switch (color) {
        case 'red':
            c = chalk.red;
            break;
        case 'green':
            c = chalk.green;
            break;
    }
    // No restriction on out; always want to show output.
    console.log(c(...message));
}

export function out(...message: any[]): void {
    color('white', message);
}

export function highlight(...message: any[]): void {
    // Treat highlight like info.
    if (level <= LogLevel.Info) {
        console.log(chalk.green(...message));
    }
}
export function debug(...message: any[]): void {
    if (level <= LogLevel.Debug) {
        console.debug(chalk.gray('[DEBUG]', ...message));
    }
}

export function verbosity(argv: Arguments): void {
    const v = argv.verbosity;
    if (!v) {
        return;
    }
    switch (v) {
        case 'all': {
            level = LogLevel.All;
            break;
        }
        case 'debug': {
            level = LogLevel.Debug;
            break;
        }
        case 'info': {
            level = LogLevel.Info;
            break;
        }
        case 'warn': {
            level = LogLevel.Warn;
            break;
        }
        case 'error': {
            level = LogLevel.Error;
            break;
        }
        default: {
            throw `verbosity ${v} is not valid. Use one of 'all', 'debug', 'info', 'warn', 'error'.`;
        }
    }
}
