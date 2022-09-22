import * as constants from './constants';
import { ModeClient } from './api-client';
import { getPassword, getToken } from './config';

// Get currently authenticated user
async function getCurrentUserForClient(
    client: ModeClient
): Promise<string | null> {
    let user: string | null;
    try {
        const data = await (await client.request('/account')).json();
        user = data.username;
    } catch (err) {
        user = null;
    }

    return user;
}

// Check if an auth token is valid. Returns username for corresponding user
// if token is valid; otherwise returns null.
export async function checkAuth(
    token: string,
    password: string
): Promise<string | null> {
    const client = new ModeClient({
        token,
        password,
        account: constants.account,
    });

    return getCurrentUserForClient(client);
}

// Instantiate a new Mode client with auth token/password loaded from local config
export function getClientWithAuth(): ModeClient {
    const token = getToken();
    const password = getPassword();
    if (token === null || password === null) {
        throw Error(`Cannot load API token and password.

To use Mode, you have to
first initialize your Mode credentials. Try running:

    nva mode setup

and try this command again.`);
    }
    return new ModeClient({ token, password, account: constants.account });
}

export async function getCurrentUser(): Promise<string | null> {
    const client = getClientWithAuth();
    return getCurrentUserForClient(client);
}
