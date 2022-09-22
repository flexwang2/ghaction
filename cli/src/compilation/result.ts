import { ExecResult } from 'src/lib/exec';
import webpack from 'webpack';

export interface CompilationResult {
    // Name of compilation unit
    name: string;
    // Compilation time, in milliseconds
    time: number;
    // Mark compilation start time
    markStart: () => void;
    // Mark compilation end time
    markEnd: () => void;
    // format time
    formatTime: () => string;
    // True if compilation generated 1 or more warnings
    hasWarnings: () => boolean;
    // True if compilation generated 1 or more errors
    hasErrors: () => boolean;
    // String representation of results
    toString: () => string;
    // Children
    children: () => CompilationResult[];
    // Add child result
    appendChild: (child: CompilationResult) => void;
}

export class CliCompilationResult implements CompilationResult {
    private _name: string;
    private _errors: Error[] = [];
    private _warnings: string[] = [];
    private _startTime = 0;
    private _endTime = 0;
    private _children: CompilationResult[] = [];
    private _stdout: string | null = null;

    constructor(name: string) {
        this._name = name;
    }

    public markStart(): void {
        this._startTime = Date.now();
    }

    public markEnd(): void {
        this._endTime = Date.now();
    }

    public hasWarnings(): boolean {
        return this._warnings.length > 0 || this.childrenHaveWarnings();
    }

    public hasErrors(): boolean {
        return this._errors.length > 0 || this.childrenHaveErrors();
    }

    public appendError(err: Error): void {
        this._errors.push(err);
    }

    public appendWarning(warning: string): void {
        this._warnings.push(warning);
    }

    public toString(): string {
        return this._stdout ?? '';
    }

    public children(): CompilationResult[] {
        return this._children;
    }

    public getChild(name: string): CompilationResult | null {
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }
        }
        return null;
    }

    public appendChild(child: CompilationResult): void {
        this._children.push(child);
    }

    public get name(): string {
        return this._name;
    }

    public get time(): number {
        if (this._endTime && this._startTime) {
            return this._endTime - this._startTime;
        } else {
            return 0;
        }
    }

    public set execResult(e: ExecResult | null) {
        if (!e) {
            this.appendError(new Error('No output from compilation command'));
        } else {
            if (e.error) {
                this.appendError(e.error);
            }
            if (e.exitCode !== 0) {
                this.appendError(new Error(`Exit code ${e.exitCode}`));
            }
            this._stdout = e.stdout;
        }
    }

    public formatTime(): string {
        const seconds = Math.round(this.time / 1000);
        let time = `${seconds} seconds`;
        if (seconds > 60) {
            time = `${Math.floor(seconds / 60)} minutes ${
                seconds % 60
            } seconds`;
        }
        return time;
    }

    private childrenHaveErrors(): boolean {
        for (const child of this._children) {
            if (child.hasErrors()) {
                return true;
            }
        }
        return false;
    }

    private childrenHaveWarnings(): boolean {
        for (const child of this._children) {
            if (child.hasWarnings()) {
                return true;
            }
        }
        return false;
    }
}

export class WebpackCompilationResult implements CompilationResult {
    private _name: string;
    private _errors: Error[] = [];
    private _warnings: string[] = [];
    private _startTime = 0;
    private _endTime = 0;
    private _children: CompilationResult[] = [];
    private _stats: webpack.compilation.MultiStats | null = null;

    constructor(name: string) {
        this._name = name;
    }

    public markStart(): void {
        this._startTime = Date.now();
    }

    public markEnd(): void {
        this._endTime = Date.now();
    }

    public hasWarnings(): boolean {
        return this._stats?.hasWarnings() || this.childrenHaveWarnings();
    }

    public hasErrors(): boolean {
        return this._stats?.hasErrors() || this.childrenHaveErrors();
    }

    public appendError(err: Error): void {
        this._errors.push(err);
    }

    public appendWarning(warning: string): void {
        this._warnings.push(warning);
    }

    public toString(): string {
        if (this._stats) {
            return this._stats.toString('minimal');
        } else {
            return '';
        }
    }

    public children(): CompilationResult[] {
        return this._children;
    }

    public getChild(name: string): CompilationResult | null {
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }
        }
        return null;
    }

    public appendChild(child: CompilationResult): void {
        this._children.push(child);
    }

    public get name(): string {
        return this._name;
    }

    public get time(): number {
        if (this._endTime && this._startTime) {
            return this._endTime - this._startTime;
        } else {
            return 0;
        }
    }

    public setResult(
        err: Error | null,
        stats?: webpack.compilation.MultiStats
    ): void {
        if (err) {
            this.appendError(err);
        } else if (stats) {
            this._stats = stats;
        }
    }

    public formatTime(): string {
        const seconds = Math.round(this.time / 1000);
        let time = `${seconds} seconds`;
        if (seconds > 60) {
            time = `${Math.floor(seconds / 60)} minutes ${
                seconds % 60
            } seconds`;
        }
        return time;
    }

    private childrenHaveErrors(): boolean {
        for (const child of this._children) {
            if (child.hasErrors()) {
                return true;
            }
        }
        return false;
    }

    private childrenHaveWarnings(): boolean {
        for (const child of this._children) {
            if (child.hasWarnings()) {
                return true;
            }
        }
        return false;
    }
}
