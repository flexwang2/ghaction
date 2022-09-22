import { Directory, File } from 'src/lib/fs';
import { compiledMailchimpTemplates } from './resources';

// TODO(seth) This duplicates the interface defined in
// client-mono/packages/email-templates/src/lib/mailchimp-template.ts.
// Ideally, we'd share this this instead of duplicating it.
export interface CompiledMailchimpTemplate {
    name: string;
    id: string;
    html: string;
}

function validate(t: Record<string, any>): string[] {
    const errors: string[] = [];
    if (typeof t['name'] !== 'string') {
        errors.push('name must be a string');
    }
    if (typeof t['id'] !== 'string') {
        errors.push('id must be a string');
    }
    if (typeof t['html'] !== 'string') {
        errors.push('html must be a string');
    }
    return errors;
}

export class MailchimpTemplateLoader {
    constructor(private readonly dir: Directory) {
        if (!dir.exists()) {
            throw `Directory does not exist (${dir.path}).`;
        }
    }

    public static createWithDefaultPaths(): MailchimpTemplateLoader {
        return new MailchimpTemplateLoader(compiledMailchimpTemplates());
    }

    private loadFile(file: File): CompiledMailchimpTemplate {
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
        const t = obj as CompiledMailchimpTemplate;

        return t;
    }

    public loadAll(): CompiledMailchimpTemplate[] {
        return this.dir.files
            .filter((f) => f.path.endsWith('.json'))
            .map((f) => this.loadFile(f));
    }
}
