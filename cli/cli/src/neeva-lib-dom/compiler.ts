import {
    CliCompilationResult,
    CompilationResult,
} from 'src/compilation/result';
import { CompilationEvent } from 'src/compilation/event';
import { Directory, File } from 'src/lib/fs';
import { FSWatcher, watch } from 'chokidar';
import { UpdateTime } from 'src/compilation/input';
import {
    distDir,
    lastCompileHashFile,
    lastCompileTimeFile,
    srcDir,
} from './module';
import { yarn } from './module';
import Emittery from 'emittery';
import moment from 'moment';

interface NeevaLibDomCompilerOptions {
    // neeva-lib source directory
    srcDir?: Directory;
    // neeva-lib dist directory
    distDir?: Directory;
    // neeva-lib last compile time file
    lastCompileTimeFile?: File;
    // neeva-lib last compile hash file
    lastCompileHashFile?: File;
    // frequency to poll in watch mode
    pollInterval?: number;
}

export class NeevaLibDomCompiler {
    public events = new Emittery.Typed<
        {
            [CompilationEvent.BeforeStep]: CompilationResult;
            [CompilationEvent.AfterStep]: CompilationResult;
            [CompilationEvent.BeforeCompilation]: CompilationResult;
            [CompilationEvent.AfterCompilation]: CompilationResult;
        },
        CompilationEvent.WatchStart | CompilationEvent.WatchStop
    >();
    private _tsUpdateTime: UpdateTime;
    private _watcher: FSWatcher | null;
    private _loopTimeout: NodeJS.Timeout | null = null;
    private _pollInterval = 1000;
    private _srcDir = srcDir();
    private _distDir = distDir();
    private _lastCompileTimeFile = lastCompileTimeFile();
    private _lastCompileHashFile = lastCompileHashFile();
    private _lastCompileHash: string | null = null;
    private _isCompiling = false;

    constructor(args: NeevaLibDomCompilerOptions = {}) {
        if (typeof args.pollInterval === 'number') {
            this._pollInterval = args.pollInterval;
        }

        if (args.srcDir) {
            this._srcDir = args.srcDir;
        }

        if (args.distDir) {
            this._distDir = args.distDir;
        }

        if (args.lastCompileTimeFile) {
            this._lastCompileTimeFile = args.lastCompileTimeFile;
        }

        if (args.lastCompileHashFile) {
            this._lastCompileHashFile = args.lastCompileHashFile;
        }

        if (this._lastCompileHashFile.exists()) {
            this._lastCompileHash = this._lastCompileHashFile.read().trim();
        }

        // Initialize the UpdateTimes. Note that we initialize lastCompile to
        // _before_ lastChange; this means that we will always do an initial
        // compilation every time the watcher is kicked off.
        this._tsUpdateTime = {
            lastChange: moment(),
            lastCompile: moment().subtract(1, 'seconds'),
        };

        // Initialize watcher to null; will be created later on-demand
        this._watcher = null;
    }

    public async build(): Promise<CompilationResult> {
        const result = new CliCompilationResult('neeva-lib-dom');
        const hash = await this.genHash();
        const shouldBuild = hash !== this._lastCompileHash;

        if (shouldBuild) {
            result.markStart();
            this.events.emit(CompilationEvent.BeforeCompilation, result);
            result.appendChild(await this.compileTypeScript());

            // We touch a file here to notify that the new compilation is
            // complete. This notifies webpack (or whoever else is listening)
            // that they can begin their compilation process.
            this._lastCompileTimeFile.write(moment().format());

            // Record hash of built src
            this._lastCompileHash = hash;
            this._lastCompileHashFile.write(hash);

            // Notify listeners that build is complete
            result.markEnd();
            this.events.emit(CompilationEvent.AfterCompilation, result);
        }

        return result;
    }

    public async compileTypeScript(): Promise<CompilationResult> {
        const result = new CliCompilationResult('neeva-lib-dom:tsc');
        await this.events.emit(CompilationEvent.BeforeStep, result);
        result.markStart();
        result.execResult = await yarn('run', 'compile', '--incremental');
        result.markEnd();
        await this.events.emit(CompilationEvent.AfterStep, result);
        return result;
    }

    public watch(): void {
        this.events.emit(CompilationEvent.WatchStart);
        this.initWatcher();
        this.loop();
    }

    public shutdown(): void {
        if (this._watcher) {
            this._watcher.close();
            this.events.emit(CompilationEvent.WatchStop);
        }
        if (this._loopTimeout !== null) {
            clearTimeout(this._loopTimeout);
        }
    }

    private loop = async (): Promise<void> => {
        // This is the core loop function of the application. It periodically checks
        // to see if the watcher has flagged that any relevant files have changed,
        // and if they have, it kicks off the compilation step.

        // For each of the things below, we look to see if the most recent
        // relevant change occurred after the last compile was kicked off. If
        // so, then we kick off the relevant compile. If a file changes while
        // this compile is happening, then the compile will be redone the next
        // time the loop runs.
        if (
            this._tsUpdateTime.lastChange.isAfter(
                this._tsUpdateTime.lastCompile
            )
        ) {
            this._tsUpdateTime.lastCompile = moment();
            await this.build();
        }

        // Wait before recompiling.
        this._loopTimeout = setTimeout(this.loop, this._pollInterval);
    };

    private initWatcher(): void {
        // Watch for changes to neeva-lib files, and recompile them if necessary.

        // This is similar to using tsc -w, but we require a slightly more
        // complicated setup, since we need to look for other file change types
        // (i.e. graphql) that would require a recompile.

        // The watcher looks for changes in the /src directory, determines what
        // type of change it is (graphql/non-graphql), and updates the relevant
        // UpdateTime object. It doesn't do any recompilation itself; instead,
        // the core loop function will periodically look for changes and re-run
        // the appropriate compilation steps.
        this._watcher = watch(this._srcDir.toString()).on(
            'all',
            (_, name: string): void => {
                if (/\.tsx?$/.test(name)) {
                    this._tsUpdateTime.lastChange = moment();
                }
            }
        );
    }

    public async genHash(): Promise<string> {
        const { hash } = await this._srcDir.hash();
        return hash;
    }

    public get busy(): boolean {
        return this._isCompiling;
    }
}
