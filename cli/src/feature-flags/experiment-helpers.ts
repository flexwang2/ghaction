import { ArmOverrides, Experiment, ExperimentArm } from './experiment';
import { FeatureFlag } from './feature-flag';
import { File } from 'src/lib/fs';
import { convertToPascalCase } from 'src/lib/strings/format';
import { flagDataDir } from './module';

export function getAllExperimentFiles(): File[] {
    const expFiles = flagDataDir().files.filter((f): boolean =>
        f.basename.endsWith('.experiment.yaml')
    );
    return expFiles;
}

function createControlArmFromFlag(flag: FeatureFlag): ExperimentArm {
    const boolOverrides: ArmOverrides<boolean> = {};
    const intOverrides: ArmOverrides<number> = {};
    const floatOverrides: ArmOverrides<number> = {};
    const stringOverrides: ArmOverrides<string> = {};

    switch (flag.type) {
        case 'bool':
            boolOverrides[flag.id] = { value: false };
            break;
        case 'int':
            intOverrides[flag.id] = { value: 0 };
            break;
        case 'float':
            floatOverrides[flag.id] = { value: 0.0 };
            break;
        case 'string':
            stringOverrides[flag.id] = { value: 'control' };
            break;
    }

    return {
        id: 0,
        name: 'Control',
        boolOverrides,
        intOverrides,
        floatOverrides,
        stringOverrides,
    };
}

function createEnabledArmFromFlag(flag: FeatureFlag): ExperimentArm {
    const boolOverrides: ArmOverrides<boolean> = {};
    const intOverrides: ArmOverrides<number> = {};
    const floatOverrides: ArmOverrides<number> = {};
    const stringOverrides: ArmOverrides<string> = {};

    switch (flag.type) {
        case 'bool':
            boolOverrides[flag.id] = { value: true };
            break;
        case 'int':
            intOverrides[flag.id] = { value: 1 };
            break;
        case 'float':
            floatOverrides[flag.id] = { value: 1.0 };
            break;
        case 'string':
            stringOverrides[flag.id] = { value: 'enabled' };
            break;
    }

    return {
        id: 1,
        name: 'Enabled',
        boolOverrides,
        intOverrides,
        floatOverrides,
        stringOverrides,
    };
}

export function createExperimentForFlag(flag: FeatureFlag): Experiment {
    const name = convertToPascalCase(flag.metadata.name.replace(/\./g, '_'));
    const exp = Experiment.fromData({
        id: flag.id,
        name,
        description: flag.metadata.description,
        yamlFile: Experiment.calculateYamlFileFromName(name),
    });

    exp.addArm(createControlArmFromFlag(flag));
    exp.addArm(createEnabledArmFromFlag(flag));
    return exp;
}
