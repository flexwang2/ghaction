import * as semver from 'semver';
import { ReadValueOptions, readValue } from './prompt';

// Show prompt to ask user if they want to continue (yes / no question)
export async function yesNoPrompt(
    instruction: string,
    defaultResponse = false
): Promise<boolean> {
    const transformation = (value: string): boolean => {
        const matchedYes = /^(y|yes)$/i.test(value);
        const matchedNo = /^(n|no)$/i.test(value);

        if (matchedYes) {
            return true;
        }

        if (matchedNo) {
            return false;
        }

        return defaultResponse;
    };

    if (defaultResponse === true) {
        instruction = `${instruction} [Yn]`;
    } else {
        instruction = `${instruction} [yN]`;
    }

    return Boolean(await readValue({ instruction, transformation }));
}

// Show prompt asking user to pick an item from a list
export interface PickFromListOptions<Entity> {
    prompt?: string;
    choices: Entity[];
    getLabel?: (item: Entity) => string;
}

export async function pickFromList<Entity extends { toString: () => string }>(
    options: PickFromListOptions<Entity>
): Promise<Entity> {
    const { prompt, choices, getLabel } = options;
    const instruction = prompt || 'Please pick an item';

    const description = choices.map((item: Entity, idx: number) => {
        let label: string;

        if (typeof getLabel === 'function') {
            label = getLabel(item);
        } else {
            label = item.toString();
        }
        return ` ${idx + 1}) ${label}`;
    });

    description.push('');

    const choice = await readValue<Entity>({
        instruction,
        description,
        validation: {
            errorMsg: 'Invalid value',
            validate: (value: string): boolean => {
                try {
                    const idx = parseInt(value, 10);
                    return idx >= 1 && idx <= choices.length;
                } catch (e) {
                    return false;
                }
            },
        },
        transformation: (value: string) => {
            const idx = parseInt(value, 10) - 1;
            return choices[idx];
        },
    });

    return choice;
}

// Prompt user for semver value
export async function readSemVer(
    rvo: ReadValueOptions = {}
): Promise<semver.SemVer> {
    return readValue<semver.SemVer>({
        ...rvo,
        validation: {
            errorMsg: 'Valid semver required',
            validate: (v: string): boolean => {
                return Boolean(semver.parse(v));
            },
        },
        transformation: (v: string): semver.SemVer =>
            semver.parse(v) ?? (semver.parse('0.0.0') as semver.SemVer),
    });
}

// Prompt user for int
export async function readInt(rvo: ReadValueOptions = {}): Promise<number> {
    return readValue<number>({
        ...rvo,
        validation: {
            errorMsg: 'Int value required',
            validate: (v: string): boolean => {
                const vAsFloat = parseFloat(v);
                const vAsInt = parseInt(v, 10);

                return !(
                    isNaN(vAsFloat) ||
                    isNaN(vAsInt) ||
                    vAsFloat.toString() !== vAsInt.toString()
                );
            },
        },
        transformation: (v: string): number => parseInt(v, 10),
    });
}

// Prompt user non-empty string
export async function readNonEmptyString(
    rvo: ReadValueOptions = {}
): Promise<string> {
    return readValue<string>({
        ...rvo,
        validation: {
            errorMsg: 'Value required',
            validate: (v: string): boolean => v.trim().length > 0,
        },
        transformation: (v: string): string => v.trim(),
    });
}
