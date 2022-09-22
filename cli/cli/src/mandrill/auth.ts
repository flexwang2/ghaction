import { MandrillClient } from 'src/mandrill/client';
import { MandrillUserInfo } from 'src/mandrill/api';

export function getApiKey(): string {
    return process.env['MANDRILL_API_KEY'] || '';
}

export async function getCurrentUser(): Promise<MandrillUserInfo> {
    const c = new MandrillClient(getApiKey());
    return await c.whoami();
}
