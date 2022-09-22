import { MandrillTemplateResponse } from 'src/mandrill/api';

export class Template {
    private apiData: MandrillTemplateResponse | undefined;

    static fromApiResponse(res: MandrillTemplateResponse): Template {
        const t = new Template();
        t.apiData = res;
        return t;
    }

    get hasUnpublishedChanges(): boolean {
        return this.apiData?.code !== this.apiData?.publish_code;
    }

    get name(): string {
        return this.apiData?.name ?? '';
    }

    get slug(): string {
        return this.apiData?.slug ?? '';
    }

    get labels(): string[] {
        return this.apiData?.labels ?? [];
    }

    get lastModified(): string {
        return this.apiData?.updated_at ?? '';
    }

    get created(): string {
        return this.apiData?.created_at ?? '';
    }

    get lastPublished(): string {
        return this.apiData?.published_at ?? '';
    }
}
