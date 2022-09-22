export interface Query {
    id: string;
    token: string;
    raw_query: string;
    created_at: string;
    updated_at: string;
    name: string;
    last_run_id: string;
    data_source_id: string;
    explorations_count: number;
    report_imports_count: number;
    _links: {
        self: {
            href: string;
        };
        report: {
            href: string;
        };
        report_runs: {
            href: string;
        };
        charts: { href: string };
        new_chart: { href: string };
        new_query_table: { href: string };
        query_tables: { href: string };
        query_runs: { href: string };
        creator: { href: string };
    };
    _forms: {
        edit: {
            method: string;
            action: string;
            content_type: string;
            input: {
                query: {
                    raw_query: string;
                    name: {
                        type: string;
                        value: string;
                    };
                    data_source_id: {
                        type: string;
                        value: number;
                    };
                };
            };
        };
        destroy: {
            method: string;
            action: string;
        };
    };
}

export interface QueryModification {
    name: string;
    raw_query: string;
    data_source_id: number;
}
