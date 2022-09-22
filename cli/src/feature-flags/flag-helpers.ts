import { FeatureFlag, FeatureFlagType } from './feature-flag';
import { File } from 'src/lib/fs';
import { flagDataDir } from './module';

export function getAllFlagFiles(): File[] {
    const ffFiles = flagDataDir().files.filter((f): boolean =>
        f.basename.endsWith('.flag.yaml')
    );
    return ffFiles;
}

export function getAllExperimentFiles(): File[] {
    const epFiles = flagDataDir().files.filter((f): boolean =>
        f.basename.endsWith('.experiment.yaml')
    );
    return epFiles;
}

export function parseFlagFile(file: File): FeatureFlag {
    return FeatureFlag.fromYamlFile(file);
}

export function getAllFlags(): FeatureFlag[] {
    return getAllFlagFiles().map(parseFlagFile);
}

export function grepAllFlags(pattern: string): FeatureFlag[] {
    const re = new RegExp(pattern);
    return getAllFlags().filter((flag): boolean => {
        return re.test(flag.metadata.name);
    });
}

export function getAllFlagNames(): Set<string> {
    const names = getAllFlags().map((f): string => f.metadata.name);
    return new Set(names);
}

export function getAllFlagIDs(): Set<number> {
    const ids = getAllFlags().map((f): number => f.id);
    return new Set(ids);
}

interface CreateFlagArgs {
    name: string;
    id: number;
    type: FeatureFlagType;
    description: string;
    clientVisible: boolean;
    owners: string[];
}
export function createFlag(args: CreateFlagArgs): FeatureFlag {
    const { name, id, type, description, clientVisible, owners } = args;
    return FeatureFlag.fromData({
        id,
        type,
        metadata: {
            name,
            description,
            clientVisible,
            owners,
        },
        yamlFile: FeatureFlag.calculateYamlFileFromName(name),
        goFile: FeatureFlag.calculateGoFileFromName(name),
    });
}
