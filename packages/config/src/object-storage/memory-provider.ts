import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { ObjectStorageProvider, SignedObjectUrl, StoredObjectReference } from "./types.js";

const MEMORY_REFERENCE_PREFIX = "memory-object://";
const MEMORY_SIGNED_URL_PREFIX = "memory-signed://";

interface MemorySignedPayload {
  objectKey: string;
  expiresAtMs: number;
  purpose: "download" | "upload";
}

export class MemoryObjectStorageProvider implements ObjectStorageProvider {
  private readonly objects = new Map<string, Buffer>();
  private readonly signingSecret = randomBytes(32).toString("hex");

  putObject(objectKey: string, buffer: Buffer, _contentType: string): Promise<StoredObjectReference> {
    this.objects.set(objectKey, Buffer.from(buffer));
    return Promise.resolve({
      reference: `${MEMORY_REFERENCE_PREFIX}${objectKey}`,
      objectKey
    });
  }

  createSignedDownloadUrl(objectKey: string, expiresInSeconds: number): Promise<SignedObjectUrl> {
    return Promise.resolve(this.buildSignedUrl(objectKey, expiresInSeconds, "download"));
  }

  createSignedUploadUrl(
    objectKey: string,
    _contentType: string,
    expiresInSeconds: number
  ): Promise<SignedObjectUrl> {
    return Promise.resolve(this.buildSignedUrl(objectKey, expiresInSeconds, "upload"));
  }

  deleteObject(objectKey: string): Promise<void> {
    this.objects.delete(objectKey);
    return Promise.resolve();
  }

  resolveObjectKey(reference: string): string {
    if (!reference.startsWith(MEMORY_REFERENCE_PREFIX)) {
      throw new Error(`Unsupported memory object reference: ${reference}`);
    }

    const objectKey = reference.slice(MEMORY_REFERENCE_PREFIX.length);
    if (objectKey.length === 0) {
      throw new Error("Memory object reference is missing an object key");
    }

    return objectKey;
  }

  validateSignedUrl(signedUrl: string, purpose: "download" | "upload"): { objectKey: string } {
    const payload = this.parseSignedUrl(signedUrl);
    if (payload.purpose !== purpose) {
      throw new Error("Signed URL purpose mismatch");
    }

    if (Date.now() > payload.expiresAtMs) {
      throw new Error("Signed URL expired");
    }

    return { objectKey: payload.objectKey };
  }

  private buildSignedUrl(
    objectKey: string,
    expiresInSeconds: number,
    purpose: "download" | "upload"
  ): SignedObjectUrl {
    const expiresAtMs = Date.now() + expiresInSeconds * 1000;
    const payload: MemorySignedPayload = { objectKey, expiresAtMs, purpose };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", this.signingSecret).update(encodedPayload).digest("base64url");
    const url = `${MEMORY_SIGNED_URL_PREFIX}${encodedPayload}.${signature}`;

    return {
      url,
      expiresAt: new Date(expiresAtMs),
      objectKey
    };
  }

  private parseSignedUrl(signedUrl: string): MemorySignedPayload {
    if (!signedUrl.startsWith(MEMORY_SIGNED_URL_PREFIX)) {
      throw new Error("Invalid memory signed URL");
    }

    const token = signedUrl.slice(MEMORY_SIGNED_URL_PREFIX.length);
    const separatorIndex = token.lastIndexOf(".");
    if (separatorIndex <= 0) {
      throw new Error("Invalid memory signed URL token");
    }

    const encodedPayload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);
    const expectedSignature = createHmac("sha256", this.signingSecret).update(encodedPayload).digest("base64url");
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new Error("Invalid memory signed URL signature");
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as MemorySignedPayload;
    return payload;
  }
}
