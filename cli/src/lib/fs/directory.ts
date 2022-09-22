import { ExecResult } from 'src/lib/exec';
import { File } from './file';
import { HashElementNode, HashElementOptions, hashElement } from 'folder-hash';
import {
    appendFileSync,
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync,
} from 'fs';
import { basename, join, resolve } from 'path';
import { sync as mkdirp } from 'mkdirp';
import { rmdir } from './rmdir';

/**
 * Represent a directory in the filesystem. The directory may not yet exist.
 */
export class Directory {
    /** absolute path to directory */
    public path: string;

    /** Create from path */
    public static fromPath(...args: string[]): Directory {
        return new Directory(resolve.apply(resolve, args));
    }

    /**
     *
     * @param path absolute or relative path
     * @param cwd used to resolve path (if path is relative)
     */
    constructor(path: string, cwd: string = process.cwd()) {
        this.path = resolve(cwd, path);
    }

    /** Delete the directory from disk */
    public rm(): Promise<ExecResult> {
        return rmdir(this.path);
    }

    /** Create a new child directory */
    public mkdirp(...args: string[]): Directory {
        const dir = new Directory(this.resolve(...args));
        mkdirp(dir.path);
        return dir;
    }

    /**
     * Return a path resolved relative to this directory's path
     * @param path resolve path relative to this directory
     */
    public resolve(...path: string[]): string {
        return resolve(this.path, ...path);
    }

    /**
     * Write content to a file relative to this directory
     * @param data content to write
     * @param path path to file relative to this directory
     */
    public write(data: string, ...path: string[]): void {
        return writeFileSync(resolve(this.path, ...path), data);
    }

    /**
     * Append content to a file relative to this directory
     * @param data content to append
     * @param path path to file relative to this directory
     */
    public append(data: string, ...path: string[]): void {
        return appendFileSync(resolve(this.path, ...path), data);
    }

    /**
     * Read contents of a file relative to this directory
     * @param path path to file relative to this directory
     */
    public read(...path: string[]): string {
        const filePath = this.resolve(...path);
        return readFileSync(filePath).toString();
    }

    /** check if directory exists */
    public exists(): boolean {
        return existsSync(this.path);
    }

    /**
     * Get a `File` reference to a file relative to this directory
     * @param path path to file relative to this directory
     */
    public file(...path: string[]): File {
        return new File(this.resolve(...path));
    }

    /**
     * Get a `Directory` reference to a directory relative to this directory
     * @param path path to directory relative to this directory
     */
    public dir(...path: string[]): Directory {
        return new Directory(this.resolve(...path));
    }

    /**
     * Get all child directories
     */
    public get subdirs(): Directory[] {
        return readdirSync(this.path)
            .filter((f: string) => {
                return statSync(join(this.path, f)).isDirectory();
            })
            .map((f: string) => {
                return new Directory(join(this.path, f));
            });
    }

    /**
     * Returns a list of all files contained within this directory
     */
    public get files(): File[] {
        return readdirSync(this.path)
            .filter((f: string) => {
                return statSync(join(this.path, f)).isFile();
            })
            .map((f: string) => {
                return new File(join(this.path, f));
            });
    }

    /** String representation of directory (the path) */
    public toString(): string {
        return this.path;
    }

    /**
     * Get `basename` portion of this directory's path
     */
    public get basename(): string {
        return basename(this.path);
    }

    /**
     * Generate hash of directory contents
     */
    public hash(options?: HashElementOptions): Promise<HashElementNode> {
        return hashElement(this.toString(), options);
    }
}
