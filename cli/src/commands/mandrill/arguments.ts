import { Arguments } from 'src/arguments';
import { MandrillClient } from 'src/mandrill/client';

export interface MandrillArguments extends Arguments {
    // API key required to authenticate with Mandrill.
    apiKey?: string;
    // Mandrill  client
    client?: MandrillClient;
    // Operate in staging mode. Note: there is no actual "staging" environment for Mandrill, but this flag is used
    // to prefix templates with `staging-` to prevent modifying production templates during development and testing.
    staging?: boolean;
}
