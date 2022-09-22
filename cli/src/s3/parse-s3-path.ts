export function parseS3URL(path: string): { bucket: string; key: string } {
    if (!path) {
        throw new Error(`Invalid S3 URL: ${path}`);
    }
    const u = new URL(path);
    if (!u || !/^[sS]3:$/.test(u.protocol)) {
        throw new Error(`Invalid S3 URL: ${path}`);
    }
    return {
        bucket: u.host,
        key: u.pathname.startsWith('/')
            ? u.pathname.replace('/', '')
            : u.pathname,
    };
}

export function getArchiveS3Key(sourceKey: string, sourceFile: string): string {
    const { key } = parseS3URL(
        sourceKey.endsWith('/')
            ? sourceKey + sourceFile
            : sourceKey + `/${sourceFile}`
    );
    return key;
}
