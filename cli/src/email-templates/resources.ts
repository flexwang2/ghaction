import * as repo from 'src/repo';
import { Directory } from 'src/lib/fs';

export function projectDir(): Directory {
    return repo.rootDir().dir('client-mono', 'packages', 'email-templates');
}

export function genDir(): Directory {
    return projectDir().dir('gen');
}

export function compiledMandrillTemplates(): Directory {
    return genDir().dir('mandrill', 'templates');
}

export function compiledMailchimpTemplates(): Directory {
    return genDir().dir('mailchimp', 'templates');
}
