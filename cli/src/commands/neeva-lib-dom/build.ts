import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { CompilationEvent } from 'src/compilation/event';
import { NeevaLibDomCompiler } from 'src/neeva-lib-dom/compiler';
import { clean, distDir } from 'src/neeva-lib-dom/module';
import { terminal as term } from 'terminal-kit';

interface BuildCommandArgs extends Arguments {
    watch?: boolean;
    clean?: boolean;
}

export const BuildCommand: CommandModule<Arguments, BuildCommandArgs> = {
    command: 'build',
    describe: 'Build neeva-lib-dom',
    builder: (yargs) => {
        return yargs.options({
            watch: {
                type: 'boolean',
                default: false,
                description: 'Watch and rebuild on changes',
            },
            clean: {
                type: 'boolean',
                default: false,
                description: 'Force a rebuild',
            },
        });
    },
    handler: async (argv): Promise<void> => {
        if (argv.clean) {
            log.info(`Cleaning ${distDir().toString()}...`);
            const res = await clean();
            if (res?.error) {
                log.error(res.stderr);
                process.exit(1);
            }
        }

        const compiler = new NeevaLibDomCompiler();

        compiler.events.on(CompilationEvent.WatchStart, (): void => {
            term.green('neeva-lib: ').defaultColor('watching for changes...\n');
        });

        compiler.events.on(CompilationEvent.WatchStop, (): void => {
            term.green('neeva-lib-dom: ').defaultColor('watching stopped\n');
        });

        compiler.events.on(CompilationEvent.BeforeStep, ({ name }): void => {
            term.green('neeva-lib-dom: ').defaultColor(
                `running ${name} step...`
            );
        });

        compiler.events.on(CompilationEvent.AfterStep, (result): void => {
            if (result.hasErrors()) {
                term.red('neeva-lib-dom: ').defaultColor(
                    `${result.name} compilation error\n`
                );
                term.defaultColor(result.toString());
            } else {
                term.green(' ✔\n');
            }
        });

        compiler.events.on(
            CompilationEvent.AfterCompilation,
            (result): void => {
                if (result.hasErrors()) {
                    term.red('\nneeva-lib-dom: ').defaultColor(
                        `💥 Compilation completed with errors in ${result.formatTime()}\n`
                    );
                } else if (result.hasWarnings()) {
                    term.yellow('neeva-lib-dom: ').defaultColor(
                        `👀 Compilation completed with warnings in ${result.formatTime()}\n`
                    );
                } else {
                    term.green('neeva-lib-dom: ').defaultColor(
                        `✅ Compilation completed in ${result.formatTime()}\n`
                    );
                }
            }
        );

        if (argv.watch) {
            compiler.watch();
            process.on('SIGINT', function () {
                term.yellow('Shutting down...');
                compiler.shutdown();
                process.exit();
            });
        } else {
            compiler.build();
        }
    },
};
