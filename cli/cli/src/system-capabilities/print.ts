import * as log from 'src/lib/log';
import { getSystemCaps } from './system';

export async function printSystemCaps(): Promise<void> {
    const caps = await getSystemCaps();
    log.out(JSON.stringify(caps, null, 4));
}
