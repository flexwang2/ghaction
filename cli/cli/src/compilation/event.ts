export enum CompilationEvent {
    WatchStart = 'watchStart',
    WatchStop = 'watchStop',
    BeforeCompilation = 'beforeCompilation',
    BeforeStep = 'beforeStep',
    BeforeDependencyCompilation = 'beforeDependencyCompilation',
    AfterDependencyCompilation = 'afterDependencyCompilation',
    AfterCompilation = 'afterCompilation',
    AfterStep = 'afterStep',
}
