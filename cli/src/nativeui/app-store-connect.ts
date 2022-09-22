import { Directory, File } from 'src/lib/fs';

export function privateKeyDir(): Directory {
    return Directory.fromPath(process.env['HOME'] ?? '/home', '.private_keys');
}

export function keyIDFile(): File {
    return privateKeyDir().file('key_id');
}

export function setKeyID(id: string): void {
    privateKeyDir().mkdirp();
    keyIDFile().write(id);
}

export function getKeyID(): string {
    try {
        return keyIDFile().read().trim();
    } catch (err) {
        return '';
    }
}

export function keyFile(): File {
    return privateKeyDir().file(`AuthKey_${getKeyID()}.p8`);
}

export function issuerIDFile(): File {
    return privateKeyDir().file('issuer_id');
}

export function getIssuerID(): string {
    try {
        return issuerIDFile().read().trim();
    } catch (err) {
        return '';
    }
}

export function setIssuerID(id: string): void {
    privateKeyDir().mkdirp();
    issuerIDFile().write(id);
}

export function lintPrivateKeysDir(): boolean {
    return Boolean(getKeyID()) && Boolean(getIssuerID()) && keyFile().exists();
}
