import * as repo from 'src/repo';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { getHttpdCommitM1, getHttpdCommitProd } from 'src/release-status';
import { terminal as term } from 'terminal-kit';

export const WhereIsMyCodeCommand: CommandModule<Arguments, Arguments> = {
    command: 'where-is-my-code <commit>',
    aliases: ['wmc'],
    describe: 'see release status of a commit or PR',
    handler: async (args): Promise<void> => {
        term('Looking for commit ').cyan(args.commit).defaultColor('...\n');
        await repo.fetchMaster();

        const prodCommit = await getHttpdCommitProd();
        const m1Commit = await getHttpdCommitM1();

        const inMaster = await repo.isAncestor(
            args.commit as string,
            'origin/master'
        );
        const inM1 = await repo.isAncestor(args.commit as string, m1Commit);
        const inProd = await repo.isAncestor(args.commit as string, prodCommit);

        // Env: Merged (master)
        if (inMaster) {
            term.brightGreen('✅ merged to master');
        } else {
            term.brightRed('❌ merged to master');
        }
        term.white(` (origin/master)\n`);

        // Env: M1
        if (inM1) {
            term.brightGreen('✅ pushed to m1-httpd');
        } else {
            term.brightRed('❌ pushed to m1-httpd');
        }
        term.white(` (${m1Commit})\n`);

        // Env: Prod
        if (inProd) {
            term.brightGreen('✅ pushed to alpha-httpd');
        } else {
            term.brightRed('❌ pushed to alpha-httpd');
        }
        term.white(` (${prodCommit})\n`);

        term.gray(
            `\nSee also: https://internal.neeva.dev/grafana/d/hTOnd0hZk/binaries\n`
        );
    },
};
