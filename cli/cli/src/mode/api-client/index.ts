import { Headers, Response, default as fetch } from 'node-fetch';
import { Query, QueryModification } from './schemas';

export interface ModeClientOptions {
    token: string;
    password: string;
    account: string;
}

interface RequestOptions {
    method?: string;
    body?: string;
}

export class ModeClient {
    private token: string;
    private password: string;
    private account: string;

    constructor(options: ModeClientOptions) {
        this.token = options.token;
        this.password = options.password;
        this.account = options.account;
    }

    private getBasicAuthHeaderValue(): string {
        return `Basic ${Buffer.from(`${this.token}:${this.password}`).toString(
            'base64'
        )}`;
    }

    public async deleteRequest(path: string): Promise<Response> {
        return this.request(path, { method: 'DELETE' });
    }

    public async getRequest(path: string): Promise<Response> {
        return this.request(path, { method: 'GET' });
    }

    public async patchRequest(path: string, body: string): Promise<Response> {
        return this.request(path, { method: 'PATCH', body });
    }

    public async postRequest(path: string, body: string): Promise<Response> {
        return this.request(path, { method: 'POST', body });
    }

    public async request(
        path: string,
        options?: RequestOptions
    ): Promise<Response> {
        const h = new Headers();
        h.append('Authorization', this.getBasicAuthHeaderValue());
        h.append('Content-Type', 'application/json');
        h.append('Accept', 'application/hal+json');

        const url = `https://app.mode.com/api${path}`;

        const res = await fetch(url, {
            headers: h,
            method: options?.method ?? 'GET',
            body: options?.body ?? undefined,
        });

        if (res.status !== 200) {
            throw new Error(`${res.status} ${res.statusText}`);
        }

        return res;
    }

    public async getReportQueries(report: string): Promise<Query[]> {
        const res = await this.request(
            `/${this.account}/reports/${report}/queries`
        );
        return (await res.json())._embedded.queries as Query[];
    }

    public async deleteQueryFromReport(
        query: string,
        report: string
    ): Promise<boolean> {
        const res = await this.deleteRequest(
            `/${this.account}/reports/${report}/queries/${query}`
        );
        return res.status === 200;
    }

    public async addQueryToReport(
        query: QueryModification,
        report: string
    ): Promise<boolean> {
        const res = await this.postRequest(
            `/${this.account}/reports/${report}/queries`,
            JSON.stringify({
                query,
            })
        );

        return res.status === 201;
    }

    public async updateQueryInReport(
        queryToken: string,
        query: QueryModification,
        report: string
    ): Promise<boolean> {
        const res = await this.patchRequest(
            `/${this.account}/reports/${report}/queries/${queryToken}`,
            JSON.stringify({
                query,
            })
        );

        return res.status === 200;
    }
}
