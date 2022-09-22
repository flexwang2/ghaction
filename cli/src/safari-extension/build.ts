import { Directory, File } from 'src/lib/fs';
import { ExecResult, execfg } from 'src/lib/exec';
import { getIssuerID, getKeyID } from './app-store-connect';
import { rootDir } from './module';

export function buildDir(): Directory {
    return rootDir().dir('build');
}

export function archiveDir(): Directory {
    return buildDir().dir('Neeva.xcarchive');
}

export function exportOptionsFile(): File {
    return rootDir().file('export-options.plist');
}

export function ipaFile(): File {
    return buildDir().file('Neeva.ipa');
}

export function pathToBuild(): Directory {
    return rootDir().dir('..');
}

export async function buildArchive(): Promise<ExecResult> {
    const archivePath = archiveDir().toString();
    const status = await execfg(`make release -C ${pathToBuild().toString()}`);

    if (status.error) {
        return execfg(
            `xcodebuild -configuration AppStoreDistribution archive -archivePath "${archivePath}" -scheme Neeva`,
            {
                cwd: rootDir().toString(),
            }
        );
    }

    return status;
}

export function exportIpa(): Promise<ExecResult> {
    const exportOptions = exportOptionsFile().toString();
    const archivePath = archiveDir().toString();
    const exportPath = buildDir().toString();

    return execfg(
        `xcodebuild -exportArchive -archivePath "${archivePath}" -exportOptionsPlist "${exportOptions}" -exportPath "${exportPath}"`,
        {
            cwd: rootDir().toString(),
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
            cwd: rootDir().toString(),
        }
    );
}
