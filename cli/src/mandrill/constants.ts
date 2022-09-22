export const stagingSlugPrefix = 'staging-';
export const stagingNamePrefix = '[STAGING] ';
export const stagingLabel = 'staging';

export function isStagingSlug(s: string): boolean {
    return s.startsWith(stagingSlugPrefix);
}

export function isStagingName(s: string): boolean {
    return s.startsWith(stagingNamePrefix);
}

export function getStagingSlug(s: string): string {
    return isStagingSlug(s) ? s : `${stagingSlugPrefix}${s}`;
}

export function getStagingName(s: string): string {
    return isStagingName(s) ? s : `${stagingNamePrefix}${s}`;
}

export function getProdSlug(s: string): string {
    return isStagingSlug(s) ? s.substring(stagingSlugPrefix.length) : s;
}

export function getProdName(s: string): string {
    return isStagingName(s) ? s.substring(stagingNamePrefix.length) : s;
}
