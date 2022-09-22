import * as homeRepo from 'src/repo';
import * as translationRepo from 'src/repo/i18n-translations';
import { File } from 'src/lib/fs';

export enum TranslationProject {
    WebUI = 'webui',
    MktSite = 'mkt-site',
    Extension = 'extension',
}

// Gets the path to the translation.json file in the i18n repo
// Returns a File object representing the translation.json file
// in the i18n repo, if it exists.
// If a translations.json file does not exist, returns an empty File object.
export function getI18nRepoTranslationFile(
    project: TranslationProject,
    locale: string
): File {
    const repoLocation = translationRepo.rootDir();
    switch (project) {
        case TranslationProject.WebUI:
            return File.fromPath(
                `${repoLocation}/frontend/webui/${locale}/translation.json`
            );
        case TranslationProject.MktSite:
            return File.fromPath(
                `${repoLocation}/marketing-site/${locale}/translation.json`
            );
        case TranslationProject.Extension:
            return File.fromPath(
                `${repoLocation}/extension/locales/${locale}/translation.json`
            );
    }
}

// Gets the path to the translation.json file in the neeva repo
// Returns a File object representing the translation.json file
// in the i18n repo, if it exists.
// If a translations.json file does not exist, returns an empty File object.
export function getNeevaRepoTranslationFile(
    project: TranslationProject,
    locale: string
): File {
    const repoLocation = homeRepo.rootDir();
    switch (project) {
        case TranslationProject.WebUI:
            return File.fromPath(
                `${repoLocation}/client/webui/src/locales/${locale}/translation.json`
            );
        case TranslationProject.MktSite:
            return File.fromPath(
                `${repoLocation}/client-mono/packages/marketing-site/locales/${locale}/translation.json`
            );
        case TranslationProject.Extension:
            return File.fromPath(
                `${repoLocation}/client/extension/src/locales/${locale}/translation.json`
            );
    }
}
