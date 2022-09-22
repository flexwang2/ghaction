import * as log from 'src/lib/log';
import * as yargs from 'yargs';
import { Arguments } from './../arguments';

export const AvroCommand: yargs.CommandModule<Arguments, Arguments> = {
    command: 'avro',
    aliases: [],
    describe: 'Run queries on a local avro dataset',
    builder: (yargs): typeof yargs => {
        return yargs.options({
            type: {},
        });
    },
    handler: (): void => {
        log.error('Not implemented');
    },
};
