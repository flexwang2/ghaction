import { Octokit } from '@octokit/rest';
import { getPersonalAccessToken } from './config';

// Get currently authenticated user
async function getCurrentUserForClient(
    client: Octokit
): Promise<string | null> {
    let user: string | null;
    try {
        const { data } = await client.request('/user');
        user = data.login;
    } catch (err) {
        user = null;
    }

    return user;
}

// Check if client is authenticated with permission to access the neevaco organization
async function canAccessNeevaOrg(client: Octokit): Promise<boolean> {
    try {
        const { data } = await client.orgs.get({
            org: 'neevaco',
        });
        // This field is only populated if user has access to the org
        return typeof data.total_private_repos === 'number';
    } catch (err) {
        return false;
    }
}

// Check if an auth token is valid. Returns username for corresponding user
// if token is valid; otherwise returns null.
export async function checkAuthToken(token: string): Promise<string | null> {
    const client = new Octokit({
        auth: token,
    });

    return getCurrentUserForClient(client);
}

// Check if an auth token has access to the neevaco Github organization
export async function checkAuthTokenCanAccessNeevaOrg(
    token: string
): Promise<boolean> {
    const client = new Octokit({
        auth: token,
    });

    return canAccessNeevaOrg(client);
}

// Instantiate a new Octokit client with auth token loaded from local config
export function getClientWithAuth(): Octokit {
    const token = getPersonalAccessToken();
    if (token === null) {
        throw Error(`Cannot load personal access token.

No personal access token could be retrieved. To use github, you have to
initialize your github credentials. Try running:

    nva github setup

and try this command again.`);
    }
    return new Octokit({ auth: token, userAgent: 'neevaco' });
}

export async function getCurrentUser(): Promise<string | null> {
    const client = getClientWithAuth();
    return getCurrentUserForClient(client);
}

export async function getHasNeevaOrgAccess(): Promise<boolean> {
    const client = getClientWithAuth();
    return canAccessNeevaOrg(client);
}
