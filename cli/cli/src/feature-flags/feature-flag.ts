import * as ejs from 'ejs';
import * as yaml from 'js-yaml';
import { File } from 'src/lib/fs';
import { NoMethods } from 'src/lib/types';
import { convertToPascalCase } from 'src/lib/strings/format';
import { execfg } from 'src/lib/exec';
import { flagCodeDir, flagDataDir, flagGoTemplateFile } from './module';

export type FeatureFlagType = 'bool' | 'int' | 'float' | 'string';

interface FeatureFlagMetadata {
    name: string;
    description: string;
    clientVisible: boolean;
    owners: string[];
}

export class FeatureFlag {
    public id: number;
    public type: FeatureFlagType;
    public metadata: FeatureFlagMetadata;
    public boolValue: boolean;
    public intValue: number;
    public floatValue: number;
    public stringValue: string;
    public yamlFile?: File;
    public goFile?: File;

    public static fromYamlFile(file: File): FeatureFlag {
        const src = file.read();
        const data = yaml.safeLoad(src);
        const flag = new FeatureFlag();
        flag.yamlFile = file;

        if (typeof data === 'object') {
            const flagData = data as Record<string, any>;
            flag.id = flagData.id;
            flag.type = flagData.type;
            flag.metadata = {
                name: flagData.metadata.name,
                description: flagData.metadata.description,
                clientVisible: flagData.metadata.clientVisible,
                owners: flagData.metadata.owners,
            };
            switch (flag.type) {
                case 'int':
                    flag.intValue = flagData.rule.value;
                    break;
                case 'float':
                    flag.floatValue = flagData.rule.value;
                    break;
                case 'string':
                    flag.stringValue = flagData.rule.value;
                    break;
                case 'bool':
                    flag.boolValue = flagData.rule.value;
                    break;
            }
            flag.goFile = FeatureFlag.calculateGoFileFromName(
                flagData.metadata.name
            );
        }

        return flag;
    }

    public static fromGoFile(file: File): FeatureFlag {
        const name = FeatureFlag.calculateNameFromGoFile(file);
        const yaml = FeatureFlag.calculateYamlFileFromName(name);
        return FeatureFlag.fromYamlFile(yaml);
    }

    public static calculateYamlFileFromName(name: string): File {
        // Convert '.' characters to '_'
        return flagDataDir().file(`${name.replace(/\./g, '_')}.flag.yaml`);
    }

    public static calculateGoFileFromName(name: string): File {
        // Convert '.' characters to '_'
        return flagCodeDir().file(`${name.replace(/\./g, '_')}.go`);
    }

    public static calculateNameFromGoFile(file: File): string {
        return file.basename.replace('.go', '').replace('_', '.');
    }

    public static fromData(data: Partial<NoMethods<FeatureFlag>>): FeatureFlag {
        return new FeatureFlag(data);
    }

    public static renderYaml(flag: FeatureFlag): string {
        return yaml.dump({
            id: flag.id,
            type: flag.type,
            metadata: {
                name: flag.metadata.name,
                description: flag.metadata.description,
                client_visible: flag.metadata.clientVisible,
                owners: flag.metadata.owners,
            },
            rule: {
                value: flag.getValue(),
            },
        });
    }

    public static renderGo(flag: FeatureFlag): string {
        const src = flagGoTemplateFile().read();

        const goIdent = convertToPascalCase(
            flag.metadata.name.replace(/\./g, '_')
        );

        // Must map to types defined in serving/featureflags/flags/flags.go
        let goFlagType: string;
        let goRegisterFlagFn: string;
        switch (flag.type) {
            case 'int':
                goFlagType = 'FlagInt';
                goRegisterFlagFn = 'registerIntFlag';
                break;
            case 'float':
                goFlagType = 'FlagFloat';
                goRegisterFlagFn = 'registerFloatFlag';
                break;
            case 'string':
                goFlagType = 'FlagString';
                goRegisterFlagFn = 'registerStringFlag';
                break;
            case 'bool':
                goFlagType = 'FlagBool';
                goRegisterFlagFn = 'registerBoolFlag';
                break;
            default:
                goFlagType = 'FlagBool';
                goRegisterFlagFn = 'registerBoolFlag';
                break;
        }

        return ejs.render(src, {
            goIdent,
            goFlagType,
            goRegisterFlagFn,
            flagID: flag.id ?? 0,
            description: flag.metadata.description ?? '',
        });
    }

    constructor(inputData: Partial<NoMethods<FeatureFlag>> = {}) {
        const defaultData: NoMethods<FeatureFlag> = {
            id: 0,
            type: 'bool',
            metadata: {
                name: '<unknown>',
                description: '<no description>',
                clientVisible: false,
                owners: [],
            },
            intValue: 0,
            floatValue: 0,
            stringValue: '',
            boolValue: false,
        };

        const data: NoMethods<FeatureFlag> = {
            ...defaultData,
            ...inputData,
            metadata: {
                ...defaultData.metadata,
                ...inputData.metadata,
            },
        };

        this.id = data.id;
        this.type = data.type;
        this.metadata = data.metadata;
        this.intValue = data.intValue;
        this.floatValue = data.floatValue;
        this.stringValue = data.stringValue;
        this.boolValue = data.boolValue;
        this.yamlFile = data.yamlFile;
        this.goFile = data.goFile;
    }

    public toString(): string {
        return JSON.stringify({
            id: this.id,
            type: this.type,
            metadata: this.metadata,
            value: this.getValue(),
        });
    }

    public async writeToDisk(): Promise<void> {
        if (this.yamlFile && this.goFile) {
            this.yamlFile.write(FeatureFlag.renderYaml(this));
            this.goFile.write(FeatureFlag.renderGo(this));
        } else {
            throw new Error(
                `Feature flag ${this.metadata.name}: Unable to write to undefined files`
            );
        }
        // Run gofmt on go file
        await execfg(`gofmt -w -s ${this.goFile.path}`);
    }

    public getValue(): string | boolean | number {
        let val: string | boolean | number;
        switch (this.type) {
            case 'int':
                val = this.intValue;
                break;
            case 'float':
                val = this.floatValue;
                break;
            case 'string':
                val = this.stringValue;
                break;
            case 'bool':
            default:
                val = this.boolValue;
                break;
        }
        return val;
    }
}
