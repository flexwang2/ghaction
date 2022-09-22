import { Arguments } from 'src/arguments';
import { Client } from './client';

export interface DatabricksArguments extends Arguments {
    // ID of the databricks cluster. Either 'instance' or 'prod' should be set.
    instance?: string;
    // The API auth token.
    token?: string;
    // If set, then this will fetch and use information about the prod
    // databricks cluster, including auth from a secret.
    prod?: boolean;
    // The client
    client?: Client;
}
