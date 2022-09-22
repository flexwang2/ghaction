import * as repo from 'src/repo';
import { Directory, File } from 'src/lib/fs';

export function rootDir(): Directory {
    return repo.rootDir().dir('serving', 'featureflags');
}

export function flagDataDir(): Directory {
    return rootDir().dir('data');
}

export function flagCodeDir(): Directory {
    return rootDir().dir('flags');
}

export function flagGoTemplateFile(): File {
    return repo
        .rootDir()
        .dir('cli', 'src', 'feature-flags')
        .file('flag-template.go.ejs');
}
