import { ExecResult } from 'src/lib/exec';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import { rmdir } from './rmdir';

/**
 * Representation of a file, with helper methods for manipulating the file.
 * The file may or may not actually exist on disk.
 */
export class File {
    /** Create from file path */
    public static fromPath(...args: string[]): File {
        return new File(resolve.apply(resolve, args));
    }

    /** Absolute path to file */
    public path: string;

    /**
     * @param absPath absolute path to file an disk (may not exist)
     */
    constructor(absPath: string) {
        this.path = absPath;
    }

    /** Delete the file */
    public rm(): Promise<ExecResult> {
        return rmdir(this.path);
    }

    /** Check if file exists */
    public exists(): boolean {
        return existsSync(this.path);
    }

    /** Read and return file contents as string */
    public read(): string {
        return readFileSync(this.path).toString();
    }

    /** Read file and return buffer */
    public buffer(): Buffer {
        return readFileSync(this.path);
    }

    /**
     * Append data to the file
     * @param data string data to append to the file
     */
    public append(data: string): void {
        if (this.exists()) {
            return appendFileSync(this.path, data);
        } else {
            return this.write(data);
        }
    }

    /**
     * Write data to file, overwriting existing content
     * @param data string data to write
     */
    public write(
        data: string,
        options?:
            | {
                  encoding?: string | null;
                  mode?: number | string;
                  flag?: string;
              }
            | string
            | null
    ): void {
        return writeFileSync(this.path, data, options);
    }

    /** String representation of file (the path) */
    public toString(): string {
        return this.path;
    }

    /** Get `basename` portion of file path */
    public get basename(): string {
        return basename(this.path);
    }
}
