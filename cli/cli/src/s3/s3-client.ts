import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsCommand,
    PutObjectCommand,
    S3Client,
    S3ClientConfig,
    _Object,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { parseS3URL } from './parse-s3-path';
import fs from 'fs';

// s3Client returns a AWS S3 Client
export function getS3Client(config?: S3ClientConfig): S3Client {
    if (config) {
        return new S3Client(config);
    }
    // require AWS_REGION env variable to be truthy value
    return new S3Client({});
}

// uploadToS3 uploads body to s3://bucket/key using S3Client
export async function uploadToS3(
    client: S3Client,
    bucket: string,
    key: string,
    body: string
): Promise<void> {
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        })
    );
}

// uploadFileToS3URL uploads a file to url using S3Client
export async function uploadFileToS3URL(
    client: S3Client,
    url: string,
    file_path: string
): Promise<void> {
    const { bucket, key } = parseS3URL(url);
    const file_stream = fs.createReadStream(file_path);
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file_stream,
        })
    );
}

// uploadToS3URL uploads body to url using S3Client
export async function uploadToS3URL(
    client: S3Client,
    url: string,
    body: string
): Promise<void> {
    const { bucket, key } = parseS3URL(url);
    await uploadToS3(client, bucket, key, body);
}

// listBucket ls s3://bucket/key using S3Client
async function listBucket(
    client: S3Client,
    bucket: string,
    delimiter: string,
    key: string
): Promise<_Object[] | undefined> {
    const response = await client.send(
        new ListObjectsCommand({
            Bucket: bucket,
            Delimiter: delimiter,
            Prefix: key,
        })
    );
    return response.Contents;
}

// listBucket ls filenames in s3://bucket/key using S3Client
export async function listBucketKeys(
    client: S3Client,
    bucket: string,
    delimiter: string,
    key: string
): Promise<string[]> {
    const contents = await listBucket(client, bucket, delimiter, key);
    if (!contents || contents.length === 0) {
        return [] as string[];
    }
    const fileKeys = contents.reduce((keys, obj) => {
        if (obj && obj.Key) {
            keys.push(obj.Key);
        }
        return keys;
    }, [] as string[]);
    return fileKeys;
}

// del deletes a file with filename fileKey in bucket using S3Client
export async function del(
    client: S3Client,
    bucket: string,
    fileKey: string
): Promise<void> {
    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: fileKey,
        })
    );
}

// mv moves a file s3://bucket/fileKey to s3://bucket/newKey using S3Client
export async function mv(
    client: S3Client,
    bucket: string,
    fileKey: string,
    newKey: string
): Promise<void> {
    // copy file to new dir
    await client.send(
        new CopyObjectCommand({
            Bucket: bucket,
            CopySource: '/' + bucket + '/' + fileKey,
            Key: newKey,
        })
    );
    // delete file from old dir
    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: fileKey,
        })
    );
}

async function streamToString(stream: Readable): Promise<string> {
    return await new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () =>
            resolve(Buffer.concat(chunks).toString('utf-8'))
        );
    });
}

// getObject gets object s3://bucket/key using S3Client
export async function getObject(
    client: S3Client,
    bucket: string,
    key: string
): Promise<string | undefined> {
    const resp = await client.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
    if (!resp.Body) {
        return undefined;
    }
    const data = await streamToString(resp.Body as Readable);
    return data;
}
