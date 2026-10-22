import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

import { env } from "./env.js";

interface ByteArrayBody {
  transformToByteArray(): Promise<Uint8Array>;
}

function hasByteArrayBody(value: unknown): value is ByteArrayBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "transformToByteArray" in value &&
    typeof (value as { transformToByteArray?: unknown }).transformToByteArray === "function"
  );
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});

function buildObjectUrl(key: string): string {
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; key: string }> {
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );

  return {
    url: buildObjectUrl(key),
    key
  };
}

export async function downloadFile(key: string): Promise<Buffer> {
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key
    })
  );

  if (!hasByteArrayBody(response.Body)) {
    throw new Error(`R2 object ${key} did not include a readable body`);
  }

  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteFile(key: string): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key
    })
  );
}

export function getFileKeyFromUrl(fileUrl: string): string {
  const url = new URL(fileUrl);
  const prefix = `/${env.R2_BUCKET_NAME}/`;

  if (!url.pathname.startsWith(prefix)) {
    throw new Error(`File URL does not belong to the configured R2 bucket: ${fileUrl}`);
  }

  return decodeURIComponent(url.pathname.slice(prefix.length));
}

/** FS-79: lightweight bucket reachability check for staging health probes. */
export async function pingObjectStorageBucket(): Promise<void> {
  await client.send(
    new HeadBucketCommand({
      Bucket: env.R2_BUCKET_NAME
    })
  );
}
