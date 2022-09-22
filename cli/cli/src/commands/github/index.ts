import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { CreatePullRequestCommand } from './create-pull-request';
import { SetupCommand } from './setup';
import { StatusCommand } from './status';

export const GithubCommand: CommandModule<Arguments, Arguments> = {
    command: 'github',
    aliases: ['gh'],
    describe: 'github commands',
    builder: (yargs) => {
        return yargs
            .command(SetupCommand)
            .command(StatusCommand)
            .command(CreatePullRequestCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
