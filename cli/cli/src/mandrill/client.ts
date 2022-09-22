import {
    MandrillAddTemplateRequest,
    MandrillUpdateTemplateRequest,
    SendTemplateResponse,
} from './api';
import { MandrillTemplateResponse, MandrillUserInfo } from 'src/mandrill/api';
import { RequestInit, Response, default as fetch } from 'node-fetch';
import { Template } from 'src/mandrill/template';

export class MandrillClient {
    // Endpoint URL for Mandrill API
    private endpoint: string = 'https://mandrillapp.com/api/1.0';

    constructor(private readonly apiKey: string) {
        this.apiKey = apiKey;
    }

    private addAuthToOptions(options?: RequestInit): RequestInit {
        const auth = {
            key: this.apiKey,
        };

        if (!options || !options.body) {
            return {
                ...(options ?? {}),
                body: JSON.stringify(auth),
            };
        }

        try {
            const body = JSON.parse(options.body.toString());
            return {
                ...options,
                body: JSON.stringify({
                    ...body,
                    ...auth,
                }),
            };
        } catch (err) {
            throw new Error(
                `Unable to add auth key to request body: Unable to parse body: ${options.body}`
            );
        }
    }

    public async request(
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

    public async post(path: string, options?: RequestInit): Promise<Response> {
        return this.request(path, {
            ...(options ?? {}),
            method: 'POST',
        });
    }

    async listTemplates(): Promise<Template[]> {
        const res = await this.post('/templates/list');
        const data = await res.json();
        return data.map((d: MandrillTemplateResponse) =>
            Template.fromApiResponse(d)
        );
    }

    async getTemplate(slug: string): Promise<Template> {
        const res = await this.post('/templates/info', {
            body: JSON.stringify({
                name: slug,
            }),
        });
        const data = await res.json();
        return Template.fromApiResponse(data);
    }

    // Docs: https://mailchimp.com/developer/transactional/api/messages/send-using-message-template/
    async sendTemplate(
        slug: string,
        args: SendTemplateArgs
    ): Promise<SendTemplateResponse[]> {
        const to = [
            ...args.to.map((t) => ({ ...t, type: 'to' })),
            ...args.cc.map((t) => ({ ...t, type: 'cc' })),
            ...args.bcc.map((t) => ({ ...t, type: 'bcc' })),
        ];
        const res = await this.post('/messages/send-template', {
            body: JSON.stringify({
                template_name: slug,
                template_content: [],
                message: {
                    subject: args.subject,
                    from_name: args.fromName,
                    from_email: args.fromEmail,
                    to,
                    merge_language: 'mailchimp',
                    track_clicks: false,
                    track_opens: false,
                    global_merge_vars: args.globalMergeVars,
                },
            }),
        });
        return await res.json();
    }

    public async whoami(): Promise<MandrillUserInfo> {
        const res = await this.post('/users/info');
        return await res.json();
    }

    public async templateExists(slug: string): Promise<boolean> {
        try {
            await this.getTemplate(slug);
            return true;
        } catch (err) {
            return false;
        }
    }

    public async updateTemplate(args: SyncTemplateArgs): Promise<Template> {
        if (!args.slug) {
            throw new Error('Slug is required to update template');
        }
        const body: MandrillUpdateTemplateRequest = {
            name: args.name,
            slug: args.slug,
            from_email: args.fromEmail,
            from_name: args.fromName,
            subject: args.subject,
            code: args.html,
            text: args.text,
            publish: args.publish,
            labels: args.labels,
        };
        const res = await this.post('/templates/update', {
            body: JSON.stringify(body),
        });
        return Template.fromApiResponse(await res.json());
    }

    public async addTemplate(args: SyncTemplateArgs): Promise<Template> {
        const body: MandrillAddTemplateRequest = {
            name: args.name,
            from_email: args.fromEmail,
            from_name: args.fromName,
            subject: args.subject,
            code: args.html,
            text: args.text,
            publish: args.publish,
            labels: args.labels,
        };
        const res = await this.post('/templates/add', {
            body: JSON.stringify(body),
        });
        return Template.fromApiResponse(await res.json());
    }
}

export interface Recipient {
    name?: string;
    email: string;
}

export interface MergeVar {
    name: string;
    content: string;
}

export interface SendTemplateArgs {
    to: Recipient[];
    cc: Recipient[];
    bcc: Recipient[];
    // If fromEmail is not provided, Mandrill will use the template's default from_email value
    fromEmail?: string;
    // If fromName is not provided, Mandrill will use the template's default from_name value
    fromName?: string;
    // If subject is not provided, Mandrill will use the template's default subject value
    subject?: string;
    globalMergeVars: MergeVar[];
}

export interface SyncTemplateArgs {
    slug?: string;
    name: string;
    html: string;
    text: string;
    subject: string;
    fromEmail: string;
    fromName: string;
    publish: boolean;
    labels: string[];
}
