import { SystemCaps } from './types';
import { getNeevaCaps } from './neeva';
import { getNodeCaps } from './node';
import { getOsCaps } from './os';
import { getShellCaps } from './shell';
import { getXcodeCaps } from './xcode';
import { getYarnCaps } from './yarn';

export async function getSystemCaps(): Promise<SystemCaps> {
    return {
        neeva: getNeevaCaps(),
        node: getNodeCaps(),
        os: getOsCaps(),
        shell: getShellCaps(),
        yarn: await getYarnCaps(),
        xcode: await getXcodeCaps(),
    };
}
