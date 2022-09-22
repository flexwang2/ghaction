export interface Version {
    raw: string;
    major: number;
    minor: number;
    patch: number;
}

export enum ShellType {
    Bash = 'bash',
    Unknown = 'unknown',
    Zsh = 'zsh',
}

export enum OperatingSystem {
    Linux = 'linux',
    Mac = 'mac',
    Unknown = 'unknown',
    Windows = 'windows',
}

export interface SystemCaps {
    neeva: {
        // NEEVA_REPO directory
        home: string | null;
        // Config directory
        config: string;
        // Path to cli.sh main entry point
        main: string | null;
        // Path to executable in /usr/local/bin
        nva: string | null;
        // NEEVA_TRANSLATIONS_REPO directory
        translations: string | null;
    };
    node: {
        version: Version;
        process: {
            versions: NodeJS.ProcessVersions;
            execPath: string;
        };
    };
    os: {
        platform: keyof typeof OperatingSystem;
    };
    shell: {
        path: string;
        type: keyof typeof ShellType;
    };
    yarn: {
        version: Version;
    };
    xcode: {
        // agvtool is used to manipulate xcode project version files
        agvtool: boolean;
        // altool is used to upload built binaries to app store connect
        altool: string | null;
        // app store connect api key file
        apiKeyFile: string | null;
        // app store connect api key ID
        apiKeyID: string | null;
        // app store connect api key issuer ID
        apiIssuerID: string | null;
    };
}
