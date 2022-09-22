import { Directory, File } from 'src/lib/fs';
import { getNeevaCaps } from 'src/system-capabilities/neeva';

export function ConfigDir(): Directory {
    const { config } = getNeevaCaps();
    return Directory.fromPath(config, 'nva-mode');
}

export function TokenFile(): File {
    return ConfigDir().file('.token');
}

export function PasswordFile(): File {
    return ConfigDir().file('.password');
}

export function getToken(): string | null {
    if (TokenFile().exists()) {
        return TokenFile().read().trim();
    }
    return null;
}

export function getPassword(): string | null {
    if (PasswordFile().exists()) {
        return PasswordFile().read().trim();
    }
    return null;
}
