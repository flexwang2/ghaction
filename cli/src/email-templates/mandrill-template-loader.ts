import { Directory, File } from 'src/lib/fs';
import { compiledMandrillTemplates } from './resources';
import {
    getStagingName,
    getStagingSlug,
    stagingLabel,
} from 'src/mandrill/constants';

// TODO(seth) This duplicates the interface defined in
// client-mono/packages/email-templates/src/lib/mandrill-template.ts.
// Ideally, we'd share this this instead of duplicating it.
export interface CompiledMandrillTemplate {
    name: string;
    slug: string;
    code: string;
    text: string;
    subject: string;
    fromEmail: string;
    fromName: string;
    labels: string[];
}

function validate(t: Record<string, any>): string[] {
    const errors: string[] = [];
    if (typeof t['name'] !== 'string') {
        errors.push('name must be a string');
    }
    if (typeof t['slug'] !== 'string') {
        errors.push('slug must be a string');
    }
    if (typeof t['subject'] !== 'string') {
        errors.push('subject must be a string');
    }
    if (typeof t['code'] !== 'string') {
        errors.push('code must be a string');
    }
    if (typeof t['text'] !== 'string') {
        errors.push('text must be a string');
    }
    if (typeof t['fromEmail'] !== 'string') {
        errors.push('fromEmail must be a string');
    }
    if (typeof t['fromName'] !== 'string') {
        errors.push('fromName must be a string');
    }
    if (!Array.isArray(t['labels'])) {
        errors.push('labels must be a string array');
    }
    return errors;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export function validateMailchimpTemplate(t: Record<string, any>): string[] {
    // Not implemented yet
    return [];
}

export class MandrillTemplateLoader {
    constructor(
        private readonly templateDir: Directory,
        private readonly staging: boolean
    ) {
        if (!templateDir.exists()) {
            throw `Tdirectory does not exist (${templateDir.path}).`;
        }
    }

    public static createWithDefaultPaths(
        staging: boolean
    ): MandrillTemplateLoader {
        return new MandrillTemplateLoader(compiledMandrillTemplates(), staging);
    }

    public loadSlug(slug: string): CompiledMandrillTemplate {
        return this.loadFile(this.templateDir.file(`${slug}.json`));
    }

    private loadFile(file: File): CompiledMandrillTemplate {
        if (!file.exists()) {
            throw `Template file does not exist (${file.path}).`;
        }

        const obj = JSON.parse(file.read());
        const errors = validate(obj);
        if (errors.length) {
            throw `Template file is invalid (${file.path}): ${errors.join(
                ', '
            )}`;
        }

        // No validation errors, so we can treat this as valid
        const t = obj as CompiledMandrillTemplate;

        // Prefix name and slug in staging mode, to allow updating templates to test sending without actually
        // modifying production templates. Also add staging label.
        if (this.staging) {
            // Prefix name
            t.name = getStagingName(t.name);
            // Prefix slug
            t.slug = getStagingSlug(t.slug);
            // Add staging label
            if (!t.labels.includes(stagingLabel)) {
                t.labels = [...t.labels, stagingLabel];
            }
        }

        return t;
    }

    public loadAll(): CompiledMandrillTemplate[] {
        return this.templateDir.files
            .filter((f) => f.path.endsWith('.json'))
            .map((f) => this.loadFile(f));
    }
}
