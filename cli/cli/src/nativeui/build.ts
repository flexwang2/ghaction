import { Directory, File } from 'src/lib/fs';
import { ExecResult, execfg } from 'src/lib/exec';
import { getIssuerID, getKeyID } from './app-store-connect';
import { iosDir } from './module';

export function buildDir(): Directory {
    return iosDir().dir('build');
}

export function archiveDir(): Directory {
    return buildDir().dir('Neeva.xcarchive');
}

export function workspaceDir(): Directory {
    return iosDir().dir('Neeva.xcworkspace');
}

export function exportOptionsFile(): File {
    return iosDir().file('export-options.plist');
}

export function ipaFile(): File {
    return buildDir().file('Neeva.ipa');
}

export function buildArchive(): Promise<ExecResult> {
    const workspace = workspaceDir().toString();
    const archivePath = archiveDir().toString();

    return execfg(
        `xcodebuild -workspace "${workspace}" -scheme Neeva -sdk iphoneos -configuration AppStoreDistribution archive -archivePath "${archivePath}"`,
        {
            cwd: iosDir().toString(),
        }
    );
}

export function exportIpa(): Promise<ExecResult> {
    const exportOptions = exportOptionsFile().toString();
    const archivePath = archiveDir().toString();
    const exportPath = buildDir().toString();

    return execfg(
        `xcodebuild -exportArchive -archivePath "${archivePath}" -exportOptionsPlist "${exportOptions}" -exportPath "${exportPath}"`,
        {
            cwd: iosDir().toString(),
        }
    );
}
export async function uploadIpa(): Promise<ExecResult> {
    // const { altool } = await getXcodeCaps();
    const key = getKeyID();
    const issuer = getIssuerID();

    if (!key || !issuer) {
        throw new Error('App Store Connect credentials not available');
    }

    return execfg(
        `xcrun altool --upload-app -f "${ipaFile().toString()}" --apiKey "${key}" --apiIssuer "${issuer}"`,
        {
            cwd: iosDir().toString(),
        }
    );
}
