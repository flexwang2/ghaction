import * as yaml from 'js-yaml';
import { File } from 'src/lib/fs';
import { NoMethods } from 'src/lib/types';
import { convertToSnakeCase } from 'src/lib/strings/format';
import { flagDataDir } from './module';

export interface ArmOverrides<T = boolean> {
    [flagID: string]: {
        value: T;
    };
}

export interface ExperimentArm {
    id: number;
    name: string;
    boolOverrides: ArmOverrides<boolean>;
    intOverrides: ArmOverrides<number>;
    floatOverrides: ArmOverrides<number>;
    stringOverrides: ArmOverrides<string>;
}
export class Experiment {
    public id: number;
    public name: string;
    public description: string;
    public arms: ExperimentArm[];
    public applies: Record<string, any>;
    public yamlFile?: File;

    public static fromYamlFile(file: File): Experiment {
        const src = file.read();
        const data = yaml.safeLoad(src);
        const exp = new Experiment();
        exp.yamlFile = file;

        if (typeof data === 'object') {
            const expData = data as Record<string, any>;
            exp.id = expData.id;
            exp.name = expData.type;
            exp.description = expData.description;
            exp.arms = expData.arms;
            exp.applies = expData.applies;
        }

        return exp;
    }

    public static calculateYamlFileFromName(name: string): File {
        return flagDataDir().file(
            `${convertToSnakeCase(name)}.experiment.yaml`
        );
    }

    public static fromData(data: Partial<NoMethods<Experiment>>): Experiment {
        return new Experiment(data);
    }

    public static renderYaml(exp: Experiment): string {
        const arms = exp.arms.map(
            (arm): Record<string, any> => {
                const data: Record<string, any> = {
                    id: arm.id,
                    name: arm.name,
                };
                if (Object.keys(arm.boolOverrides).length) {
                    data.bool_overrides = arm.boolOverrides;
                }
                if (Object.keys(arm.intOverrides).length) {
                    data.int_overrides = arm.intOverrides;
                }
                if (Object.keys(arm.floatOverrides).length) {
                    data.float_overrides = arm.floatOverrides;
                }
                if (Object.keys(arm.stringOverrides).length) {
                    data.string_overrides = arm.stringOverrides;
                }
                return data;
            }
        );

        const result = yaml.dump({
            id: exp.id,
            name: exp.name,
            description: exp.description,
            applies: exp.applies,
            arms,
        });

        // TODO(seth) this is a hack because I can't figure out how to get js-yaml
        // not to quote object keys
        return result.replace(/'/g, '');
    }

    constructor(inputData: Partial<NoMethods<Experiment>> = {}) {
        const defaultData: NoMethods<Experiment> = {
            id: 0,
            name: '<unknown>',
            description: '<no description>',
            applies: {
                value: true,
            },
            arms: [],
        };

        const data: NoMethods<Experiment> = {
            ...defaultData,
            ...inputData,
        };

        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.applies = data.applies;
        this.arms = data.arms;
        this.yamlFile = data.yamlFile;
    }

    public toString(): string {
        return JSON.stringify(this, null, 4);
    }

    public writeToDisk(): void {
        if (this.yamlFile) {
            this.yamlFile.write(Experiment.renderYaml(this));
        } else {
            throw new Error(
                `Experiment ${this.name}: Unable to write to undefined files`
            );
        }
    }

    public addArm(arm: ExperimentArm): void {
        this.arms.push(arm);
    }
}
