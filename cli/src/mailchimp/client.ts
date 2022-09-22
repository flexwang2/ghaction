import {
    Audience,
    Campaign,
    ListAudiencesResponse,
    ListCampaignsResponse,
    ListTemplateFoldersResponse,
    ListTemplatesResponse,
    RootResponse,
    Template,
    TemplateFolder,
} from './api';
import { FolderID } from './constants';
import { RequestInit, Response, default as fetch } from 'node-fetch';

export class MailchimpClient {
    // Endpoint URL for Mailchimp API
    private endpoint: string = 'https://us17.api.mailchimp.com/3.0';

    constructor(private readonly apiKey: string) {
        this.apiKey = apiKey;
    }

    public async whoami(): Promise<RootResponse> {
        const res = await this.get('/');
        return await res.json();
    }

    public listTemplateFolders = async (
        args: PaginatedFnArgs
    ): Promise<ListTemplateFoldersResponse> => {
        const { count, offset } = args;
        const params = new URLSearchParams();
        params.set('count', count.toString());
        params.set('offset', offset.toString());
        const res = await this.get(`/template-folders?${params}`);
        return await res.json();
    };

    public async listAllTemplateFolders(): Promise<TemplateFolder[]> {
        return this.paginate<ListTemplateFoldersResponse, TemplateFolder>(
            this.listTemplateFolders,
            (res) => res.folders,
            (res) => res.total_items,
            10
        );
    }

    public listTemplates = async (
        args: PaginatedFnArgs
    ): Promise<ListTemplatesResponse> => {
        const { count, offset } = args;
        const params = new URLSearchParams();
        params.set('count', count.toString());
        params.set('offset', offset.toString());
        params.set('sort_field', 'date_edited');
        // Only fetch templates we created (exclude Mailchimp default templates that we don't use)
        params.set('type', 'user');
        const res = await this.get(`/templates?${params}`);
        return await res.json();
    };

    public listAllTemplates = async (): Promise<Template[]> => {
        return this.paginate<ListTemplatesResponse, Template>(
            this.listTemplates,
            (res) => res.templates,
            (res) => res.total_items,
            10
        );
    };

    public listCampaigns = async (
        args: PaginatedFnArgs
    ): Promise<ListCampaignsResponse> => {
        const { count, offset } = args;
        const params = new URLSearchParams();
        params.set('count', count.toString());
        params.set('offset', offset.toString());
        params.set('sort_field', 'create_time');
        const res = await this.get(`/campaigns?${params}`);
        return await res.json();
    };

    public listAllCampaigns = async (): Promise<Campaign[]> => {
        return this.paginate<ListCampaignsResponse, Campaign>(
            this.listCampaigns,
            (res) => res.campaigns,
            (res) => res.total_items,
            10
        );
    };

    public listAudiences = async (
        args: PaginatedFnArgs
    ): Promise<ListAudiencesResponse> => {
        const { count, offset } = args;
        const params = new URLSearchParams();
        params.set('count', count.toString());
        params.set('offset', offset.toString());
        params.set('sort_field', 'date_created');
        const res = await this.get(`/lists?${params}`);
        return await res.json();
    };

    public listAllAudiences = async (): Promise<Audience[]> => {
        return this.paginate<ListAudiencesResponse, Audience>(
            this.listAudiences,
            (res) => res.lists,
            (res) => res.total_items,
            10
        );
    };

    public async getTemplate(id: string): Promise<Template> {
        const res = await this.get(`/templates/${id}`);
        return await res.json();
    }

    public async templateExists(id: string): Promise<boolean> {
        try {
            await this.getTemplate(id);
            return true;
        } catch (e) {
            return false;
        }
    }

    public async createTemplate(args: SyncTemplateArgs): Promise<Template> {
        const res = await this.post('/templates', {
            body: JSON.stringify({
                name: args.name,
                html: args.html,
                folder_id: FolderID.SyncedWithCLI,
            }),
        });

        return await res.json();
    }

    public async updateTemplate(
        id: string,
        args: SyncTemplateArgs
    ): Promise<Template> {
        const res = await this.patch(`/templates/${id}`, {
            body: JSON.stringify({
                name: args.name,
                html: args.html,
                folder_id: FolderID.SyncedWithCLI,
            }),
        });

        return await res.json();
    }

    private async paginate<L, T>(
        fn: PaginatedFn<L>,
        extractData: (res: L) => T[],
        extractTotalCount: (res: L) => number,
        pageSize: number
    ): Promise<T[]> {
        const count = pageSize;
        let offset = 0;
        const results: T[] = [];
        const res = await fn({ count, offset });
        let total = extractTotalCount(res);
        results.push(...extractData(res));
        while (results.length < total) {
            offset += count;
            const pres = await fn({ count, offset });
            total = extractTotalCount(pres);
            results.push(...extractData(pres));
        }
        return results;
    }

    private addAuthToOptions(options?: RequestInit): RequestInit {
        const auth = Buffer.from(`anystring:${this.apiKey}`).toString('base64');

        if (!options) {
            options = {};
        }

        if (!options.headers) {
            options.headers = {};
        }

        options.headers = {
            ...options.headers,
            Authorization: `Basic ${auth}`,
        };

        return options;
    }

    private async request(
        path: string,
        options?: RequestInit
    ): Promise<Response> {
        const url = `${this.endpoint}${path}`;
        const mergedOptions = this.addAuthToOptions(options);
        const res = await fetch(url, mergedOptions);

        if (res.status !== 200) {
            throw new Error(
                `${res.status} ${res.statusText}: ${await res.text()}`
            );
        }

        return res;
    }

    private async patch(
        path: string,
        options?: RequestInit
    ): Promise<Response> {
        return this.request(path, {
            ...(options ?? {}),
            method: 'PATCH',
        });
    }

    private async post(path: string, options?: RequestInit): Promise<Response> {
        return this.request(path, {
            ...(options ?? {}),
            method: 'POST',
        });
    }

    private get = (path: string, options?: RequestInit): Promise<Response> => {
        return this.request(path, {
            ...(options ?? {}),
            method: 'GET',
        });
    };
}

interface PaginatedFnArgs {
    count: number;
    offset: number;
}

type PaginatedFn<L> = (args: PaginatedFnArgs) => Promise<L>;

interface SyncTemplateArgs {
    name: string;
    html: string;
}
