import * as log from 'src/lib/log';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { LintConfig, lint } from 'src/lib/graphql/lint';
import { exit } from 'yargs';
import { promises as fs } from 'fs';

interface LintArguments extends Arguments {
    file?: string;
    config?: string;
}

// We statically define our lint rules so we can take advantage of type
// checking.
const configs: { [key: string]: LintConfig } = {
    httpd: {
        allowedRecursiveTypes: [
            // [DictionaryEntrySense].subsenses[DictionaryEntrySense]
            'DictionaryEntrySense',
            // [RichEntityData].relatedSearches[RichEntityData]
            'RichEntityData',
            // [SpaceViewData].entities[SpaceResult].content[Result].typeSpecific[TypeSpecific][SpaceView].spaceView[SpaceViewData]
            // This is the worst offender, it causes recursion in Result.
            'SpaceViewData',
            // [Result].typeSpecific[SpaceView].spaceView[SpaceViewData].spaceEntities[SpaceEntity].spaceEntity[SpaceEntityData].content[Result]
            'SpaceEntityData',
            // [WebDataDeepLink].deepLinks[WebDataDeepLink]
            'WebDataDeepLink',
            // [WebNavLinkData].navLinks[WebNavLink].webNavLinkData[WebNavLinkData]
            'WebNavLinkData',
            // [WebForumComment].comments[WebForumComment].comments[WebForumComment]
            'WebForumComment',
        ],
    },
};

export const LintCommand: CommandModule<Arguments, LintArguments> = {
    command: 'lint',
    aliases: ['l'],
    describe: 'Lint graphql files.',
    builder: (yargs) => {
        return yargs.options({
            file: {
                alias: 'f',
                type: 'string',
                description: 'The graphql file to lint.',
            },
            config: {
                alias: 'c',
                type: 'string',
                default: '',
                description: 'name of the configuration to use.',
            },
        });
    },
    handler: async (args): Promise<void> => {
        if (!args.file) {
            throw 'Argument "file" must be provided.';
        }
        let config: LintConfig = {};
        if (args.config) {
            config = configs[args.config];
            if (!config) {
                throw `Config not found: ${args.config}`;
            }
        }
        const contents = (await fs.readFile(args.file)).toString();
        const errors = lint(contents, config);
        if (errors.length > 0) {
            log.error(`Lint errors:\n${errors.join('\n')}`);
            exit(1, Error());
        } else {
            log.out('No errors found');
        }
    },
};
