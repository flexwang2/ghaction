// API type information for the Databricks cluster.
// For more info, see:
// https://docs.databricks.com/dev-tools/api/latest/clusters.html#list
export interface ClusterInfo {
    cluster_id?: string;
    spark_context_id?: number;
    cluster_name?: string;
    spark_version?: string;
    aws_attributes?: ClusterAWSAttributes;
    node_type_id?: string;
    driver_node_type_id?: string;
    autotermination_minutes?: number;
    enable_elastic_disk?: boolean;
    disk_spec?: {
        disk_count?: number;
    };
    cluster_source?: string;
    enable_local_disk_encryption?: boolean;
    instance_source?: {
        node_type_id?: string;
    };
    driver_instance_source?: {
        node_type_id?: string;
    };
    state?: string;
    state_message?: string;
    start_time?: number;
    terminated_time?: number;
    last_state_loss_time?: number;
    num_workers?: number;
    default_tags?: ClusterDefaultTags;
    creator_user_name?: string;
    termination_reason?: ClusterTerminationReason;
    init_scripts_safe_mode?: boolean;
}

export interface ClusterAWSAttributes {
    zone_id?: string;
    first_on_demand?: number;
    availability?: string;
    spot_bid_price_percent?: number;
    ebs_volume_count?: number;
}

export interface ClusterDefaultTags {
    Vendor?: string;
    Creator?: string;
    ClusterName?: string;
    ClusterId?: string;
}

export interface ClusterTerminationReason {
    code?: string;
    parameters?: {
        inactivity_duration_min?: string;
    };
    type?: string;
}
