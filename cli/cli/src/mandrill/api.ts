// Docs: https://mailchimp.com/developer/transactional/api/templates/
export interface MandrillTemplateResponse {
    slug: string;
    name: string;
    labels: string[];
    code: string;
    subject: string;
    from_email: string;
    from_name: string;
    text: string;
    publish_name: string;
    publish_code: string;
    publish_subject: string;
    publish_from_email: string;
    publish_from_name: string;
    publish_text: string;
    published_at: string;
    created_at: string;
    updated_at: string;
}

// Docs: https://mailchimp.com/developer/transactional/api/templates/add-template/
export interface MandrillAddTemplateRequest {
    name: string;
    from_email: string;
    from_name: string;
    subject: string;
    code: string;
    text: string;
    publish: boolean;
    labels: string[];
}

// Docs: https://mailchimp.com/developer/transactional/api/templates/update-template/
export interface MandrillUpdateTemplateRequest {
    name: string;
    slug: string;
    from_email?: string;
    from_name?: string;
    subject?: string;
    code?: string;
    text?: string;
    publish?: boolean;
    labels?: string[];
}

export interface MandrillUserSendStats {
    sent: number;
    hard_bounces: number;
    soft_bounces: number;
    rejects: number;
    complaints: number;
    unsubs: number;
    opens: number;
    clicks: number;
    unique_opens: number;
    unique_clicks: number;
}

export interface MandrillUserInfo {
    username: string;
    created_at: string;
    public_id: string;
    reputation: number;
    hourly_quota: number;
    backlog: number;
    stats: {
        today: MandrillUserSendStats;
        last_7_days: MandrillUserSendStats;
        last_30_days: MandrillUserSendStats;
        last_60_days: MandrillUserSendStats;
        last_90_days: MandrillUserSendStats;
        all_time: MandrillUserSendStats;
    };
}

export interface SendTemplateResponse {
    email: string;
    status: string;
    _id: string;
    reject_reason: string | null;
}
