import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cached S3Client instance to avoid creating multiple clients.
 */
let cachedS3Client: S3Client | null = null;
let cachedEndpoint: string | null = null;

/**
 * Returns a singleton S3Client for the given environment.
 * @returns Configured S3Client instance or null
 */
export function getS3Client(): S3Client | null {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY;
    const endpoint = process.env.R2_ENDPOINT || process.env.R2_ENDPOINTS || "";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
        console.error(
            `[R2 Error] Missing Credentials: KEY=${!!accessKeyId}, SECRET=${!!secretAccessKey}, ENDPOINT=${endpoint}`
        );
        return null;
    }

    if (cachedS3Client && cachedEndpoint === endpoint) {
        return cachedS3Client;
    }

    cachedS3Client = new S3Client({
        region: "auto",
        endpoint: endpoint,
        forcePathStyle: true,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
    cachedEndpoint = endpoint;

    return cachedS3Client;
}

/**
 * Generates a URL for a file in R2.
 * Uses the internal API proxy.
 * @param objectKey - The R2 object key
 * @returns Proxy URL string or placeholder path
 */
export async function getFileUrl(
    objectKey: string | null | undefined
): Promise<string> {
    if (!objectKey) return "/placeholder.png";

    const sanitizedKey = objectKey.startsWith("/")
        ? objectKey.slice(1)
        : objectKey;

    return `/api/thumb/${sanitizedKey}`;
}

/**
 * Centrally manages video asset URLs based on metadata and structure.
 * @param objectKey - Main video object key
 * @param metadata - Processed metadata JSON
 * @returns Object containing all relevant asset URLs
 */
export async function getVideoAssets(
    objectKey: string | null | undefined,
    metadata?: any
) {
    if (!objectKey) return { src: "/placeholder.png" };

    const baseDir = objectKey.substring(0, objectKey.lastIndexOf("/"));
    const isNewStructure = objectKey.startsWith("media/videos/");

    const src = await getFileUrl(objectKey);

    // If not new structure, we don't know where assets are
    if (!isNewStructure) return { src };

    const assets: {
        src: string;
        poster?: string;
        thumbnail?: string;
        preview?: string;
        thumbnails?: string;
    } = { src };

    const hasPoster = metadata?.hasPoster || metadata?.steps?.poster;
    const hasPreview = metadata?.hasPreview || metadata?.steps?.montage_preview;
    const hasSprites = metadata?.hasSprites || metadata?.steps?.sprites;

    if (hasPoster) {
        assets.poster = await getFileUrl(`${baseDir}/poster.webp`);
        assets.thumbnail = await getFileUrl(`${baseDir}/thumbnail.webp`);
    } else {
        // Fallback for legacy structure
        assets.poster = await getFileUrl(`${baseDir}/thumbnail.webp`);
        assets.thumbnail = await getFileUrl(`${baseDir}/thumbnail.webp`);
    }

    if (hasPreview) {
        assets.preview = await getFileUrl(`${baseDir}/preview.mp4`);
    }

    if (hasSprites) {
        assets.thumbnails = await getFileUrl(`${baseDir}/sprites/index.vtt?t=${Date.now()}`);
    }

    return assets;
}

/**
 * Sequentially generates URLs for multiple keys.
 * @param objectKeys - Array of R2 object keys
 * @returns Array of proxy URL strings
 */
export async function getFileUrls(
    objectKeys: (string | null | undefined)[]
): Promise<string[]> {
    const results: string[] = [];
    for (const key of objectKeys) {
        results.push(await getFileUrl(key));
    }
    return results;
}

/**
 * Uploads a file to R2.
 * @param file - The file to upload (Uint8Array, Buffer, or Blob)
 * @param key - The destination object key
 * @param contentType - The MIME type
 * @returns The object key on success, undefined otherwise
 */
export async function uploadFile(
    file: Uint8Array | Buffer | Blob,
    key: string,
    contentType: string
): Promise<string | undefined> {
    const bucketName = process.env.MY_BUCKET || "shared-storage";
    const s3 = getS3Client();
    if (!s3) {
        console.error("Cannot upload: R2 client not initialized");
        return;
    }

    let body: any = file;
    if (file instanceof Blob) {
        body = new Uint8Array(await file.arrayBuffer());
    }

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3.send(command);
    return key;
}
