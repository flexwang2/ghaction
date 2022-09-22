import { ClusterInfo } from './model/cluster';
import { Config } from './config';
import { DatabricksArguments } from './arguments';
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import yargs from 'yargs';

export const newClient = (
    argv: yargs.Arguments<DatabricksArguments>
): Client => {
    if (argv.prod) {
        return new Client(Config.instance, Config.token);
    } else if (argv.instance && argv.token) {
        return new Client(Config.instance, Config.token);
    }
    throw 'Missing instance or token.';
};

export const clientOptions: { [key: string]: yargs.Options } = {
    instance: {
        type: 'string',
        default: undefined,
        description: 'ID of the databricks cluster.',
    },
    token: {
        type: 'string',
        default: undefined,
        description: 'Authorization token for the databricks cluster.',
    },
    prod: {
        type: 'boolean',
        alias: ['p'],
        default: false,
        description: 'Use the production cluster information.',
    },
};

interface ClusterResponse {
    clusters: ClusterInfo[];
}

export class Client {
    private token: string;
    private instance: string;

    constructor(instance: string, token: string) {
        this.instance = instance;
        this.token = token;
    }

    public async clusterStats(): Promise<any> {
        const response = await this.fetch(this.url('clusters/list'));
        const clusterResponse: ClusterResponse = await response.json();
        const out: string[] = [
            `Found ${clusterResponse.clusters.length} clusters`,
        ];
        for (const cluster of clusterResponse.clusters) {
            out.push(
                ` - ${cluster.cluster_name} (${cluster.cluster_id}: ${cluster.state})`
            );
        }
        return out.join('\n');
    }

    private url(path: string): string {
        return `https://${this.instance}/api/2.0/${path}`;
    }

    private async fetch(
        info: RequestInfo,
        init?: RequestInit
    ): Promise<Response> {
        if (!init) {
            init = {};
        }
        init.headers = {
            ...init.headers,
            Authorization: `Bearer ${this.token}`,
        };
        return await fetch(info, init);
    }
}
