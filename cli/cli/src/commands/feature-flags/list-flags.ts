import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import { FeatureFlag } from 'src/feature-flags/feature-flag';
import { getAllFlags, grepAllFlags } from 'src/feature-flags/flag-helpers';
import { terminal as term } from 'terminal-kit';

interface ListFlagsCommandArguments extends Arguments {
    // Extended output
    long?: boolean;
    // Filter by flag name
    grep?: string;
}

export const ListFlagsCommand: CommandModule<
    Arguments,
    ListFlagsCommandArguments
> = {
    command: 'list',
    aliases: ['ls'],
    describe: 'List feature flags',
    builder: (yargs) => {
        return yargs.options({
            long: {
                type: 'boolean',
                alias: ['l'],
                default: false,
                description: 'Show extended output',
            },
            grep: {
                type: 'string',
                alias: ['g'],
                description: 'Filter flags',
            },
        });
    },
    handler: async (args): Promise<void> => {
        let flags: FeatureFlag[];
        if (args.grep) {
            flags = grepAllFlags(args.grep);
        } else {
            flags = getAllFlags();
        }

        for (const flag of flags) {
            term.green(`${flag.metadata.name} `)
                .gray(flag.yamlFile?.path)
                .defaultColor('\n');
        }
    },
};
