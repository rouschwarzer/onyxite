import { NextRequest, NextResponse } from "next/server";
import { getS3Client } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth/server";

/**
 * GET handler for the thumbnail proxy.
 * Fetches media from R2 via S3 and serves it with caching.
 * @param req - The Next.js request object
 * @param props - Route parameters including the object key
 * @returns Response with media body and headers
 */
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ key: string[] }> }
) {
    const params = await props.params;
    const key = Array.isArray(params.key) ? params.key.join("/") : params.key;

    // session check
    const { data: session } = await auth.getSession();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!key) {
        return new NextResponse("Missing key", { status: 400 });
    }

    const range = req.headers.get("range");

    try {
        const s3 = getS3Client();
        if (!s3) {
            return new NextResponse("Internal Server Error: Storage Not Available", {
                status: 500,
            });
        }

        const bucketName = process.env.MY_BUCKET || "shared-storage";

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            Range: range || undefined,
        });

        const response = await s3.send(command);

        if (!response.Body) {
            return new NextResponse("Object not found", { status: 404 });
        }

        const headers = new Headers();

        // Detect Content-Type if missing or generic
        const ext = key.split(".").pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
            vtt: "text/vtt",
            webp: "image/webp",
            mp4: "video/mp4",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
        };

        let contentType = response.ContentType;
        if (ext && mimeMap[ext]) {
            contentType = mimeMap[ext];
        } else if (!contentType || contentType === "application/octet-stream") {
            if (ext && mimeMap[ext]) {
                contentType = mimeMap[ext];
            }
        }

        if (contentType) {
            headers.set("Content-Type", contentType);
        }

        if (response.ETag) {
            headers.set("ETag", response.ETag);
        }

        // Range specific headers
        headers.set("Accept-Ranges", "bytes");
        if (response.ContentRange) {
            headers.set("Content-Range", response.ContentRange);
        }
        if (response.ContentLength !== undefined) {
            headers.set("Content-Length", response.ContentLength.toString());
        }

        // Cache for 1 year (except VTT which we rewrite)
        if (ext === "vtt") {
            headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            headers.set("Pragma", "no-cache");
            headers.set("Expires", "0");
        } else {
            headers.set("Cache-Control", "public, max-age=31536000, immutable");
        }

        // Rewriting for VTT thumbnails to handle relative paths in players
        if (ext === "vtt") {
            try {
                const text = await response.Body.transformToString();
                const baseDir = key.substring(0, key.lastIndexOf("/"));

                // Replace relative image paths with absolute proxy paths
                // Matches lines like: sheet-1.webp#xywh=0,0,160,90
                // We use a more robust regex that handles potential whitespace
                const rewritten = text.replace(/^([\s]*)([^#\s]+\.(webp|jpg|jpeg|png|gif))/gm, (fullMatch, p1, p2) => {
                    return `${p1}/api/thumb/${baseDir}/${p2}`;
                });

                return new NextResponse(rewritten, {
                    status: 200,
                    headers,
                });
            } catch (err: any) {
                console.error("[VTT_PROXY] Rewrite Error:", err.message);
                // Fallback to original body if rewrite fails
            }
        }

        // Convert Body to Response (handling both Node.js Readable and Web Streams)
        return new NextResponse(response.Body as any, {
            status: range ? 206 : 200,
            headers,
        });
    } catch (err: any) {
        // Handle specific S3 errors
        const statusCode = err.$metadata?.httpStatusCode || 500;
        const errorCode = err.name;

        if (errorCode === "NoSuchKey" || statusCode === 404) {
            return new NextResponse("Object not found", { status: 404 });
        }

        if (errorCode === "InvalidRange" || statusCode === 416) {
            return new NextResponse("Range Not Satisfiable", { status: 416 });
        }

        if (statusCode === 403) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        console.error(`[Proxy Error] Failed to fetch R2 object for key: ${key}`, {
            name: err.name,
            code: err.code,
            message: err.message,
            statusCode
        });

        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
