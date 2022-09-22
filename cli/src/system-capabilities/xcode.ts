import { Directory } from 'src/lib/fs';
import { SystemCaps } from './types';
import { exec } from 'src/lib/exec';
import { getIssuerID, getKeyID, keyFile } from 'src/nativeui/app-store-connect';

function xcodeDevBinDir(): Directory {
    return Directory.fromPath(
        '/Applications/Xcode.app/Contents/Developer/usr/bin'
    );
}

export async function getXcodeCaps(): Promise<SystemCaps['xcode']> {
    const result = await exec('type agvtool');
    const hasAgvtool = result.exitCode === 0;
    const altoolPath = xcodeDevBinDir().file('altool');

    return {
        agvtool: hasAgvtool,
        altool: altoolPath.exists() ? altoolPath.toString() : null,
        apiKeyFile: keyFile().exists() ? keyFile().path : null,
        apiKeyID: getKeyID(),
        apiIssuerID: getIssuerID(),
    };
}
