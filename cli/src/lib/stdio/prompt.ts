import { readLine } from './read';
import chalk from 'chalk';

export interface ValueValidator {
    errorMsg: string;
    validate: (value: any) => boolean;
}

export type ValueTransform = (value: any) => any;

export interface ReadValueOptions {
    prompt?: string;
    instruction?: string | (() => string);
    description?: string[];
    validation?: ValueValidator | ValueValidator[];
    transformation?: ValueTransform | ValueTransform[];
    silent?: boolean;
    out?: NodeJS.WritableStream;
}

export async function readValue<Value = string>(
    rvo: ReadValueOptions = {}
): Promise<Value> {
    const options: ReadValueOptions = {
        prompt: '> ',
        instruction: undefined,
        description: [],
        validation: [],
        transformation: [],
        silent: false,
        out: process.stdout,
        ...rvo,
    };

    interface ValidationResult {
        valid: boolean;
        errors: string[];
    }

    const validate = (value: any): ValidationResult => {
        const { validation } = options;

        let validators: ValueValidator[] = [];

        if (!Array.isArray(validation)) {
            if (validation) {
                validators = [validation];
            }
        } else {
            validators = validation;
        }

        const result: ValidationResult = {
            valid: true,
            errors: [],
        };

        for (const v of validators) {
            if (!v.validate(value)) {
                result.errors.push(v.errorMsg);
                result.valid = false;
            }
        }

        return result;
    };

    const transform = (value: any): any => {
        const { transformation } = options;

        if (!transformation) {
            return value;
        }

        let transformers: ValueTransform[];

        if (!Array.isArray(transformation)) {
            transformers = [transformation];
        } else {
            transformers = transformation;
        }

        return transformers.reduce((val: any, vt: ValueTransform) => {
            return vt(val);
        }, value);
    };

    const { instruction, description, out } = options;
    if (typeof instruction === 'function' && out) {
        out.write(chalk.cyan(instruction()));
        out.write('\n');
    }

    if (typeof instruction === 'string' && out) {
        out.write(chalk.cyan(instruction));
        out.write('\n');
    }

    if (description?.length && out) {
        description.forEach((line) => out.write(`  ${line}`));
        out.write('\n');
    }

    const read = async (): Promise<Value> => {
        const { prompt, silent } = options;
        const value = await readLine({ prompt, silent });
        const result = validate(value);

        if (!result.valid && out) {
            result.errors.forEach((e) => out.write(`${e}\n`));
            return await read();
        }

        return transform(value);
    };

    return await read();
}
