export interface SignedObjectUrl {
  url: string;
  expiresAt: Date;
  objectKey: string;
}

export interface StoredObjectReference {
  /** Value persisted on file_attachments.file_url */
  reference: string;
  objectKey: string;
}

export interface ObjectStorageProvider {
  putObject(objectKey: string, buffer: Buffer, contentType: string): Promise<StoredObjectReference>;
  createSignedDownloadUrl(objectKey: string, expiresInSeconds: number): Promise<SignedObjectUrl>;
  createSignedUploadUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds: number
  ): Promise<SignedObjectUrl>;
  deleteObject(objectKey: string): Promise<void>;
  resolveObjectKey(reference: string): string;
}
