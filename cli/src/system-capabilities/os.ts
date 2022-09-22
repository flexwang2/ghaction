import { OperatingSystem, SystemCaps } from './types';

export function getOsCaps(): SystemCaps['os'] {
    let platform: keyof typeof OperatingSystem;
    switch (process.platform) {
        case 'darwin':
            platform = 'Mac';
            break;
        case 'linux':
            platform = 'Linux';
            break;
        case 'win32':
            platform = 'Windows';
            break;
        default:
            platform = 'Unknown';
    }

    return {
        platform,
    };
}
