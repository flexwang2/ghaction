import {
    ReadLineOptions as NodeReadLineOptions,
    createInterface,
} from 'readline';
import { Writable } from 'stream';
import chalk from 'chalk';

export type ColorizeStringFn = (...text: string[]) => string;

export interface CustomReadLineOptions {
    prompt?: string;
    silent?: boolean;
    color?: boolean | ColorizeStringFn;
}

export type ReadLineOptions =
    | CustomReadLineOptions
    | (NodeReadLineOptions & {
          input?: NodeJS.ReadableStream;
          prompt?: string;
          silent?: boolean;
          color?: boolean | ColorizeStringFn;
      });

// Colorize prompt based on options
export function colorizePrompt(rlo: ReadLineOptions): string | undefined {
    if (rlo.color === true) {
        return chalk.greenBright(rlo.prompt);
    }

    if (typeof rlo.color === 'function' && rlo.prompt) {
        return rlo.color(rlo.prompt);
    }

    return rlo.prompt;
}

// Read a string from stdin
export function readLine(rlo: ReadLineOptions): Promise<string> {
    const options = {
        prompt: '> ',
        silent: false,
        color: true,
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        ...rlo,
    };

    const prompt = colorizePrompt(options);

    if (options.silent) {
        options.output = new Writable({
            write: (chunk, encoding, callback): void => callback(),
        }) as any;
        if (prompt) {
            process.stdout.write(prompt);
        }
    }

    return new Promise((resolve): void => {
        const rl = createInterface(options);
        rl.setPrompt(prompt ?? '');
        rl.prompt();
        rl.on('line', (line: string) => {
            rl.close();

            if (options.silent) {
                process.stdout.write('**********\n');
            }
            resolve(line);
        });
    });
}
