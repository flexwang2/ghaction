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

// Indicate which pieces will be rebuilt
interface BuildPlan {
    emoji: boolean;
    graphql: boolean;
    typescript: boolean;
    tokens: boolean;
}

interface NeevaLibCompilerOptions {
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

export class NeevaLibCompiler {
    public events = new Emittery.Typed<
        {
            [CompilationEvent.BeforeStep]: CompilationResult;
            [CompilationEvent.AfterStep]: CompilationResult;
            [CompilationEvent.BeforeCompilation]: CompilationResult;
            [CompilationEvent.AfterCompilation]: CompilationResult;
        },
        CompilationEvent.WatchStart | CompilationEvent.WatchStop
    >();
    private _graphqlUpdateTime: UpdateTime;
    private _emojiUpdateTime: UpdateTime;
    private _tsUpdateTime: UpdateTime;
    private _tokensUpdateTime: UpdateTime;
    private _watcher: FSWatcher | null;
    private _loopTimeout: NodeJS.Timeout | null = null;
    private _pollInterval = 1000;
    private _srcDir = srcDir();
    private _distDir = distDir();
    private _lastCompileTimeFile = lastCompileTimeFile();
    private _lastCompileHashFile = lastCompileHashFile();
    private _lastCompileHash: string | null = null;
    private _isCompiling = false;

    constructor(args: NeevaLibCompilerOptions = {}) {
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
        this._graphqlUpdateTime = {
            lastChange: moment(),
            lastCompile: moment().subtract(1, 'seconds'),
        };

        this._tsUpdateTime = {
            lastChange: moment(),
            lastCompile: moment().subtract(1, 'seconds'),
        };

        this._emojiUpdateTime = {
            lastChange: moment(),
            lastCompile: moment().subtract(1, 'seconds'),
        };

        this._tokensUpdateTime = {
            lastChange: moment(),
            lastCompile: moment().subtract(1, 'seconds'),
        };

        // Initialize watcher to null; will be created later on-demand
        this._watcher = null;
    }

    public async build(buildPlan?: BuildPlan): Promise<CompilationResult> {
        // Build everything by default
        const plan = buildPlan || {
            emoji: true,
            graphql: true,
            typescript: true,
            tokens: true,
        };

        const result = new CliCompilationResult('neeva-lib');
        const hash = await this.genSrcHash();
        const shouldBuild =
            (plan.emoji || plan.graphql || plan.typescript) &&
            hash !== this._lastCompileHash;

        if (shouldBuild) {
            result.markStart();
            await this.events.emit(CompilationEvent.BeforeCompilation, result);
            this._isCompiling = true;
            if (plan.emoji) {
                result.appendChild(await this.generateEmojiMap());
            }
            if (plan.graphql) {
                result.appendChild(await this.generateGraphql());
            }
            if (plan.tokens) {
                result.appendChild(await this.generateTokens());
            }
            if (plan.typescript) {
                result.appendChild(await this.compileTypeScript());
            }

            // We touch a file here to notify that the new compilation is
            // complete. This notifies webpack (or whoever else is listening)
            // that they can begin their compilation process.
            this._lastCompileTimeFile.write(moment().format());

            // Record hash of built src
            this._lastCompileHash = hash;
            this._lastCompileHashFile.write(hash);

            // Notify listeners that build is complete
            result.markEnd();
            await this.events.emit(CompilationEvent.AfterCompilation, result);
            this._isCompiling = false;
        }

        return result;
    }

    public async compileTypeScript(): Promise<CompilationResult> {
        const result = new CliCompilationResult('neeva-lib:tsc');
        await this.events.emit(CompilationEvent.BeforeStep, result);
        result.markStart();
        result.execResult = await yarn('run', 'compile', '--incremental');
        result.markEnd();
        await this.events.emit(CompilationEvent.AfterStep, result);
        return result;
    }

    public async generateGraphql(): Promise<CompilationResult> {
        const result = new CliCompilationResult('neeva-lib:graphql');
        await this.events.emit(CompilationEvent.BeforeStep, result);
        result.markStart();
        result.execResult = await yarn('run', 'codegen-gql');
        result.markEnd();
        await this.events.emit(CompilationEvent.AfterStep, result);
        return result;
    }

    public async generateEmojiMap(): Promise<CompilationResult> {
        const result = new CliCompilationResult('neeva-lib:emoji');
        await this.events.emit(CompilationEvent.BeforeStep, result);
        result.markStart();
        result.execResult = await yarn('run', 'codegen-emoji');
        result.markEnd();
        await this.events.emit(CompilationEvent.AfterStep, result);
        return result;
    }

    public async generateTokens(): Promise<CompilationResult> {
        const result = new CliCompilationResult('neeva-lib:tokens');
        await this.events.emit(CompilationEvent.BeforeStep, result);
        result.markStart();
        result.execResult = await yarn('run', 'codegen-tokens');
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

        // Track which pieces to build
        const plan: BuildPlan = {
            emoji: false,
            graphql: false,
            typescript: false,
            tokens: false,
        };

        // If the emoji map needs to be regenerated...
        if (
            this._emojiUpdateTime.lastChange.isAfter(
                this._tsUpdateTime.lastChange
            )
        ) {
            // ...we should also recompile the typescript.
            this._tsUpdateTime.lastChange = this._emojiUpdateTime.lastChange;
        }
        // If the graphql needs to be regenerated...
        if (
            this._graphqlUpdateTime.lastChange.isAfter(
                this._tsUpdateTime.lastChange
            )
        ) {
            // ...we should also recompile the typescript.
            this._tsUpdateTime.lastChange = this._graphqlUpdateTime.lastChange;
        }
        // For each of the things below, we look to see if the most recent
        // relevant change occurred after the last compile was kicked off. If
        // so, then we kick off the relevant compile. If a file changes while
        // this compile is happening, then the compile will be redone the next
        // time the loop runs.
        if (
            this._emojiUpdateTime.lastChange.isAfter(
                this._emojiUpdateTime.lastCompile
            )
        ) {
            this._emojiUpdateTime.lastCompile = moment();
            plan.emoji = true;
        }
        if (
            this._graphqlUpdateTime.lastChange.isAfter(
                this._graphqlUpdateTime.lastCompile
            )
        ) {
            this._graphqlUpdateTime.lastCompile = moment();
            plan.graphql = true;
        }
        if (
            this._tokensUpdateTime.lastChange.isAfter(
                this._tokensUpdateTime.lastCompile
            )
        ) {
            this._tokensUpdateTime.lastCompile = moment();
            plan.tokens = true;
        }
        if (
            this._tsUpdateTime.lastChange.isAfter(
                this._tsUpdateTime.lastCompile
            )
        ) {
            this._tsUpdateTime.lastCompile = moment();
            plan.typescript = true;
        }

        await this.build(plan);

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
                if (/\.graphql$/.test(name)) {
                    this._graphqlUpdateTime.lastChange = moment();
                } else if (/design-system\/tokens/.test(name)) {
                    this._tokensUpdateTime.lastChange = moment();
                } else {
                    this._tsUpdateTime.lastChange = moment();
                }
            }
        );
    }

    public async genSrcHash(): Promise<string> {
        const { hash } = await this._srcDir.hash();
        return hash;
    }

    public async genDistHash(): Promise<string> {
        const { hash } = await this._distDir.hash();
        return hash;
    }

    public get busy(): boolean {
        return this._isCompiling;
    }
}
