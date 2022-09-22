import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { CreateTranslationPRCommand } from './create-translation-pr';
import { PullTranslationsCommand } from './pull-translations';

export const I18nCommand: CommandModule<Arguments, Arguments> = {
    command: 'i18n',
    aliases: ['i18n'],
    describe: 'commands related to i18n translations',
    builder: (yargs) => {
        return yargs
            .command(CreateTranslationPRCommand)
            .command(PullTranslationsCommand)
            .demandCommand();
    },
    handler: (): void => log.error('No command specified!'),
};
