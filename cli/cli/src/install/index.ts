import { File } from 'src/lib/fs';
import { execfg } from 'src/lib/exec';
import { getNeevaCaps } from 'src/system-capabilities/neeva';
import { usrLocalBinNeeva } from './usr-local';

export async function createUsrLocalBinSymlink(): Promise<void> {
    const caps = await getNeevaCaps();
    if (!caps.main) {
        throw new Error('Unable to locate neeva cli.sh main');
    }

    const mainFile = File.fromPath(caps.main);
    if (!mainFile.exists()) {
        throw new Error(`Neeva cli.sh main does not exist (${mainFile.path})`);
    }

    const result = await execfg(
        `ln -sf "${mainFile.path}" "${usrLocalBinNeeva().path}"`
    );
    if (result.exitCode !== 0) {
        throw new Error(
            `Creating symlink failed, exit code ${result.exitCode}`
        );
    }
}
