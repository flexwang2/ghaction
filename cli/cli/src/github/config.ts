import { Directory, File } from 'src/lib/fs';
import { getNeevaCaps } from 'src/system-capabilities/neeva';

export function ConfigDir(): Directory {
    const { config } = getNeevaCaps();
    return Directory.fromPath(config, 'nva-github');
}

export function TokenFile(): File {
    return ConfigDir().file('personal_access_token');
}

export function getPersonalAccessToken(): string | null {
    if (TokenFile().exists()) {
        return TokenFile().read().trim();
    }
    return null;
}
