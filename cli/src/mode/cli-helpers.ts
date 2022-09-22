import * as log from 'src/lib/log';
import { checkAuth } from 'src/mode/auth';
import { getPassword, getToken } from 'src/mode/config';

export async function mustHaveModeAccess(): Promise<void> {
    const user = await checkAuth(
        (await getToken()) ?? '',
        (await getPassword()) ?? ''
    );

    if (!user) {
        log.error(
            'Mode authentication failed. Please re-run `nva mode setup`.'
        );
        process.exit(1);
    }
}
