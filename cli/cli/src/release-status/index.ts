const fetch = require('node-fetch');

export async function getHttpdCommitProd(): Promise<string> {
    return getHttpdCommit('https://neeva.com/signin');
}

export async function getHttpdCommitM1(): Promise<string> {
    return getHttpdCommit('https://m1.neeva.com/signin');
}

async function getHttpdCommit(url: string): Promise<string> {
    try {
        const res = await fetch(url);
        const data: string = await res.text();
        const match = data.match(/stamp: '[\w\d-]+ (\w+)/);
        if (match) {
            return match[1] ?? '';
        }
        return '';
    } catch (err) {
        return '';
    }
}
