import * as diff from 'diff';
import * as log from 'src/lib/log';
import * as readline from 'readline';
import * as repo from 'src/repo';
import * as yaml from 'js-yaml';
import { Directory, File } from 'src/lib/fs';
import { S3Client } from '@aws-sdk/client-s3';
import {
    del,
    getObject,
    getS3Client,
    listBucketKeys,
    mv,
    uploadToS3URL,
} from 'src/s3/s3-client';
import { getAllExperimentFiles, getAllFlagFiles } from './flag-helpers';
import { getArchiveS3Key, parseS3URL } from 'src/s3/parse-s3-path';
import { mkdirSync } from 'fs';
interface MergedFlagsMetadata {
    uploader: string;
    timestamp: string;
    path: string;
    gitHash: string;
    gitBranch: string;
}

interface MergedFlags {
    metadata: MergedFlagsMetadata;
    featureFlags: Record<string, any>;
    experiments: Record<string, any>;
}

const FILE_PREFIX: string = 'merged_';
const FEATURE_KEY = 'featureFlags';
const EXP_KEY = 'experiments';
const FEATURE_FLAGS_HEADER = '===Feature flags diff===';
const EXPS_HEADER = '===Experiments diff===';
const GC_LIMIT = 10;

async function initMergedFlags(
    path: string,
    uploader: string,
    timestamp: string
): Promise<MergedFlags> {
    const featureFlags = readYaml(getAllFlagFiles());
    const experiments = readYaml(getAllExperimentFiles());
    const gitBranch = await repo.currentBranchName();
    const gitHash = await repo.revParse(gitBranch);
    return {
        metadata: {
            uploader,
            timestamp,
            path,
            gitBranch,
            gitHash,
        },
        featureFlags,
        experiments,
    };
}

function loadObject(input: string): Record<string, any> | undefined {
    const data = yaml.safeLoad(input);
    if (typeof data === 'object') {
        return data as Record<string, any>;
    }
    return undefined;
}

function readYaml(files: File[]): (Record<string, any> | undefined)[] {
    return files.map((f) => loadObject(f.read()));
}

async function renderYaml(
    path: string,
    author: string,
    timestamp: string
): Promise<{ data: string; mergedFlags: MergedFlags }> {
    const mergedFlags = await initMergedFlags(path, author, timestamp);
    return {
        data: yaml.dump(mergedFlags),
        mergedFlags,
    };
}

async function writeToS3(
    data: string,
    mergedFlags: MergedFlags,
    path: string,
    fileDir: string,
    region?: string,
    force?: boolean,
    gcPath?: string
): Promise<void> {
    if (!region) {
        throw new Error(
            'feature flags write error: region for S3 bucket must be specified.'
        );
    }
    const client = getS3Client({ region });
    if (force || (await checkDiff(fileDir, client, mergedFlags))) {
        await gc(fileDir, client, gcPath);
        await uploadToS3URL(client, path, data);
    } else {
        log.error('Confirmation rejected. Exiting feature flag update...');
        throw new Error('Confirmation rejected');
    }
}

async function writeToDisk(data: string, file: File): Promise<void> {
    if (!file) {
        throw new Error('feature flags write error: file cannot be opened.');
    }
    file.write(data);
}

// if gcPath is specified, gc scans destDir, preserves the most recent bundle flag files (up to 10), and archives
// the rest to gcPath
// if gcPath is not specified, gc deletes the archived bundle flag files permanently
async function gc(
    destDir: string,
    client: S3Client,
    gcPath?: string
): Promise<void> {
    // list destDir objects
    const { bucket, key } = parseS3URL(
        destDir.endsWith('/')
            ? destDir + FILE_PREFIX
            : destDir + `/${FILE_PREFIX}`
    );
    const fileKeys = await listBucketKeys(client, bucket, '/', key);
    if (fileKeys.length < GC_LIMIT) {
        log.debug(
            `Skipping gc, only ${fileKeys.length} bundle files in ${destDir}`
        );
        return;
    }
    fileKeys.sort();
    log.debug(
        `Found ${fileKeys.length} bundle files in ${destDir}, starting gc...`
    );
    // Filenames sorted by ASC order, deleting older files only
    for (let i = 0; i < fileKeys.length - GC_LIMIT + 1; i++) {
        const fk = fileKeys[i];
        if (gcPath) {
            const newKey = getArchiveS3Key(
                gcPath,
                fk.substring(fk.lastIndexOf('/') + 1)
            );
            log.debug(`gc: mv ${fk} to dir s3://${bucket}/${newKey}`);
            // mv file to archive dir
            await mv(client, bucket, fk, newKey);
        } else {
            log.debug(`gc: delete ${fk} permanently`);
            await del(client, bucket, fk);
        }
    }
}

// promptConfirmation asks for user confirmation, returns result
async function promptConfirmation(query: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans === 'yes' ? true : false);
        })
    );
}

function logDiffs(
    lhs: Record<string, any> | undefined,
    rhs: Record<string, any> | undefined,
    lhsFilename: string,
    rhsFilename: string
): void {
    if (
        !lhs ||
        !rhs ||
        !Object.prototype.hasOwnProperty.call(lhs, FEATURE_KEY) ||
        !Object.prototype.hasOwnProperty.call(rhs, FEATURE_KEY) ||
        !Object.prototype.hasOwnProperty.call(lhs, EXP_KEY) ||
        !Object.prototype.hasOwnProperty.call(rhs, EXP_KEY)
    ) {
        throw new Error(
            'Bundle flag file read error: missing feature flags or experiments.'
        );
    }

    const lhsFeatures = yaml.dump(lhs[FEATURE_KEY]);
    const lhsExps = yaml.dump(lhs[EXP_KEY]);
    const rhsFeatures = yaml.dump(rhs[FEATURE_KEY]);
    const rhsExps = yaml.dump(rhs[EXP_KEY]);

    const featuresPatch = diff.createTwoFilesPatch(
        lhsFilename,
        rhsFilename,
        lhsFeatures,
        rhsFeatures,
        FEATURE_FLAGS_HEADER,
        FEATURE_FLAGS_HEADER,
        { context: 10 }
    );
    const expsPatch = diff.createTwoFilesPatch(
        lhsFilename,
        rhsFilename,
        lhsExps,
        rhsExps,
        EXPS_HEADER,
        EXPS_HEADER,
        { context: 10 }
    );

    if (featuresPatch.trim().endsWith(FEATURE_FLAGS_HEADER)) {
        log.out('===FEATURE FLAGS: NO CHANGE===');
    } else {
        log.out(featuresPatch);
    }

    if (expsPatch.trim().endsWith(EXPS_HEADER)) {
        log.out('===EXPERIMENTS: NO CHANGE===');
    } else {
        log.out(expsPatch);
    }
}

// diff checks the diff between new bundle file and most recent bundle file in destDir,
// displays diff, asks for confirmation
async function checkDiff(
    destDir: string,
    client: S3Client,
    mergedFlags: MergedFlags
): Promise<boolean> {
    // list destDir objects
    const { bucket, key } = parseS3URL(
        destDir.endsWith('/')
            ? destDir + FILE_PREFIX
            : destDir + `/${FILE_PREFIX}`
    );
    const fileKeys = await listBucketKeys(client, bucket, '/', key);
    if (!fileKeys.length) {
        log.warn(`Writing a new bundle file to dir: ${destDir}`);
    } else {
        // sort key DESC, get object, decode, deep diff
        fileKeys.sort().reverse();
        const recentFile = await getObject(client, bucket, fileKeys[0]);
        const filename = `s3://${bucket}/${fileKeys[0]}`;
        if (!recentFile) {
            log.error(`Most recent bundle file [${filename}] cannot be read.`);
        } else {
            logDiffs(
                loadObject(recentFile),
                mergedFlags,
                filename,
                'new bundle file'
            );
        }
    }
    // prompt for confirmation
    const conf = await promptConfirmation(
        'Deploy? (only "yes" in lowercase will be accepted): '
    );
    return conf;
}

export async function writeFeatureFlags(
    filePath: string,
    author: string,
    region?: string,
    force?: boolean,
    gcPath?: string
): Promise<string | undefined> {
    if (!filePath) {
        throw new Error('feature flags write error: empty path.');
    }
    const escapedTS = escapeTimestamp();
    const { data, mergedFlags } = await renderYaml(filePath, author, escapedTS);
    if (!data) {
        throw new Error(
            'feature flags write error: flag or experiment files cannot be read.'
        );
    }
    const filename = `${FILE_PREFIX}${escapedTS}.flag.yaml`;
    if (!filePath.startsWith('s3://')) {
        // local path
        const localDir = Directory.fromPath(filePath);
        if (!localDir.exists()) {
            mkdirSync(localDir.path, { recursive: true });
        }
        const mergedFile = new File(localDir.resolve(filename));
        await writeToDisk(data, mergedFile);
        return mergedFile.path;
    }

    // s3 write
    const s3Path = filePath.endsWith('/')
        ? `${filePath}${filename}`
        : `${filePath}/${filename}`;
    await writeToS3(data, mergedFlags, s3Path, filePath, region, force, gcPath);
    return s3Path;
}

function escapeTimestamp(): string {
    return new Date().toISOString().replace(/:/g, '-');
}
