// Docs: https://mailchimp.com/developer/marketing/api/root/list-api-root-resources/
export interface RootResponse {
    username: string;
}

export interface ListTemplateFoldersResponse {
    folders: TemplateFolder[];
    total_items: number;
    _links: ResourceLink[];
}

export interface TemplateFolder {
    name: string;
    id: string;
    count: number;
    _links: ResourceLink[];
}

export interface ResourceLink {
    rel: string;
    href: string;
    method: string;
    targetSchema: string;
    schema: string;
}

export interface ListTemplatesResponse {
    templates: Template[];
    total_items: number;
    _links: ResourceLink[];
}

export interface Template {
    id: string;
    type: string;
    name: string;
    drag_and_drop: boolean;
    responsive: boolean;
    category: string;
    date_created: string;
    date_edited: string;
    created_by: string;
    edited_by: string;
    active: boolean;
    folder_id: string;
    thumbnail: string;
    share_url: string;
    content_type: string;
    _links: ResourceLink[];
}

export interface ListCampaignsResponse {
    campaigns: Campaign[];
    total_items: number;
    _links: ResourceLink[];
}

export interface Campaign {
    id: string;
    web_id: number;
    parent_campaign_id: string;
    type: string;
    create_time: string;
    archive_url: string;
    long_archive_url: string;
    status: string;
    emails_sent: number;
    send_time: string;
    content_type: string;
    needs_block_refresh: boolean;
    resendable: boolean;
    recipients: {
        list_id: string;
        list_is_active: boolean;
        list_name: string;
        segment_text: string;
        recipient_count: number;
        segment_opts: {
            saved_segment_id: number;
            prebuilt_segment_id: string;
            match: string;
            conditions: any[];
        };
    };
    settings: {
        subject_line: string;
        preview_text: string;
        title: string;
        from_name: string;
        reply_to: string;
        use_conversation: boolean;
        to_name: string;
        folder_id: string;
        authenticate: boolean;
        auto_footer: boolean;
        inline_css: boolean;
        auto_tweet: boolean;
        auto_fb_post: string[];
        fb_comments: boolean;
        timewarp: boolean;
        template_id: number;
        drag_and_drop: boolean;
    };
    variate_settings: {
        winning_combination_id: string;
        winning_campaign_id: string;
        winner_criteria: string;
        wait_time: number;
        test_size: number;
        subject_lines: string[];
        send_times: string[];
        from_names: string[];
        reply_to_addresses: string[];
        contents: string[];
        combinations: {
            id: string;
            subject_line: number;
            send_time: number;
            from_name: number;
            reply_to: number;
            content_description: number;
            recipients: number;
        }[];
    };
    tracking: {
        opens: boolean;
        html_clicks: boolean;
        text_clicks: boolean;
        goal_tracking: boolean;
        ecomm360: boolean;
        google_analytics: string;
        clicktale: string;
        salesforce: {
            campaign: boolean;
            notes: boolean;
        };
        capsule: {
            notes: boolean;
        };
    };
    rss_opts: {
        feed_url: string;
        frequency: string;
        schedule: {
            hour: number;
            daily_send: {
                sunday: boolean;
                monday: boolean;
                tuesday: boolean;
                wednesday: boolean;
                thursday: boolean;
                friday: boolean;
                saturday: boolean;
            };
            weekly_send_day: string;
            monthly_send_date: number;
        };
        last_sent: string;
        constrain_rss_img: boolean;
    };
    ab_split_opts: {
        split_test: string;
        pick_winner: string;
        wait_units: string;
        wait_time: number;
        split_size: number;
        from_name_a: string;
        from_name_b: string;
        reply_email_a: string;
        reply_email_b: string;
        subject_a: string;
        subject_b: string;
        send_time_a: string;
        send_time_b: string;
        send_time_winner: string;
    };
    social_card: {
        image_url: string;
        description: string;
        title: string;
    };
    report_summary: {
        opens: number;
        unique_opens: number;
        open_rate: number;
        clicks: number;
        subscriber_clicks: number;
        click_rate: number;
        ecommerce: {
            total_orders: number;
            total_spent: number;
            total_revenue: number;
        };
    };
    delivery_status: {
        enabled: boolean;
        can_cancel: boolean;
        status: string;
        emails_sent: number;
        emails_canceled: number;
    };
    _links: ResourceLink[];
}

export interface ListAudiencesResponse {
    lists: Audience[];
    total_items: number;
    _links: ResourceLink[];
}

export interface Audience {
    id: string;
    web_id: number;
    name: string;
    contact: {
        company: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone: string;
    };
    permission_reminder: string;
    use_archive_bar: boolean;
    campaign_defaults: {
        from_name: string;
        from_email: string;
        subject: string;
        language: string;
    };
    notify_on_subscribe: boolean;
    notify_on_unsubscribe: boolean;
    date_created: string;
    list_rating: number;
    email_type_option: boolean;
    subscribe_url_short: string;
    subscribe_url_long: string;
    beamer_address: string;
    visibility: string;
    double_optin: boolean;
    has_welcome: boolean;
    marketing_permissions: boolean;
    modules: string[];
    stats: {
        member_count: number;
        total_contacts: number;
        unsubscribe_count: number;
        cleaned_count: number;
        member_count_since_send: number;
        unsubscribe_count_since_send: number;
        cleaned_count_since_send: number;
        campaign_count: number;
        campaign_last_sent: string;
        merge_field_count: number;
        avg_sub_rate: number;
        avg_unsub_rate: number;
        target_sub_rate: number;
        open_rate: number;
        click_rate: number;
        last_sub_date: string;
        last_unsub_date: string;
    };
    _links: ResourceLink[];
}
