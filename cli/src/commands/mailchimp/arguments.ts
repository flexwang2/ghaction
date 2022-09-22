import { Arguments } from 'src/arguments';
import { MailchimpClient } from 'src/mailchimp/client';

export interface MailchimpArguments extends Arguments {
    // API key required to authenticate with Mailchimp.
    apiKey?: string;
    // Mailchimp  client
    client?: MailchimpClient;
    // Operate in staging mode. Note: there is no actual "staging" environment for Mailchimp, but this flag is used
    // to prefix template names with `[STAGING]` to prevent modifying production templates during development and testing.
    staging?: boolean;
}
