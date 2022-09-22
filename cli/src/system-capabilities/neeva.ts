import * as path from 'path';
import { Directory } from 'src/lib/fs';
import { SystemCaps } from './types';
import { usrLocalBinNeeva } from 'src/install/usr-local';

export function getNeevaCaps(): SystemCaps['neeva'] {
    const home = process.env['NEEVA_REPO'] ?? null;

    let main = null;
    if (home?.length) {
        main = path.resolve(home, 'cli', 'cli.sh');
    }

    const configDir = Directory.fromPath(process.env['HOME'] ?? '/', '.neeva');
    const translationsDir = Directory.fromPath(
        process.env['NEEVA_TRANSLATIONS_REPO'] ?? ''
    );

    return {
        home,
        main,
        nva: usrLocalBinNeeva().exists() ? usrLocalBinNeeva().path : null,
        config: configDir.path,
        translations: translationsDir.path,
    };
}
