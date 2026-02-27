import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { files, tags, content, contentTags, artists, contentArtists } from "@/db/schema";

import { eq } from "drizzle-orm";
import { uploadFile } from "@/lib/r2";
import { auth } from "@/lib/auth/server";

/**
 * POST handler for the upload API.
 * Handles file upload to R2 and database record creation (Content + File split).
 * @param request - The incoming request object
 * @returns Response with success status and content ID
 */
export async function POST(request: NextRequest) {
    const { data: session } = await auth.getSession();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const name = (formData.get("name") as string) || "";
        const description = (formData.get("description") as string) || "";
        const category = (formData.get("category") as string) || "image";
        const visibility = (formData.get("visibility") as string) || "private";
        const selectedTags = (formData.get("tags") as string) || "";
        const artistName = (formData.get("artistName") as string) || "";


        if (!file || file.size === 0) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!name.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        /** Determine category from MIME type if not explicitly set */
        const mimeType = file.type;
        let resolvedCategory = category;
        if (category === "auto") {
            if (mimeType.startsWith("video/")) {
                resolvedCategory = "video";
            } else if (mimeType.startsWith("image/")) {
                resolvedCategory = "image";
            } else {
                resolvedCategory = "image";
            }
        }

        /** Step 1: Create the storage layer record (files) */
        const fileId = crypto.randomUUID();
        const extension = file.name.split(".").pop()?.toLowerCase() || "bin";

        let objectKey = `uploads/${userId}/${fileId}.${extension}`;
        if (resolvedCategory === "video") {
            objectKey = `media/videos/${fileId}/original.${extension === "mp4" ? "mp4" : extension}`;
        } else if (resolvedCategory === "image") {
            objectKey = `media/images/${fileId}/original.${extension === "webp" ? "webp" : extension}`;
        }

        /** Upload to R2 */
        await uploadFile(file, objectKey, mimeType);

        /** Insert physical file record */
        await db.insert(files).values({
            id: fileId,
            objectKey,
            mimeType,
            sizeBytes: file.size,
            originalName: file.name,
        });

        /** Step 2: Create the metadata layer record (content) */
        const contentId = crypto.randomUUID();
        await db.insert(content).values({
            id: contentId,
            uploaderId: userId,
            fileId: fileId,
            name: name.trim(),
            description: description.trim() || null,
            category: resolvedCategory,
            visibility: visibility as any,
            status: "active",
        });

        /** Step 3: Handle tags (associated with content) */
        if (selectedTags) {
            const tagNames = selectedTags
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean);

            for (const tagName of tagNames) {
                let [existingTag] = await db
                    .select()
                    .from(tags)
                    .where(eq(tags.name, tagName))
                    .limit(1);

                if (!existingTag) {
                    const tagId = crypto.randomUUID();
                    await db.insert(tags).values({
                        id: tagId,
                        name: tagName,
                    });

                    [existingTag] = await db
                        .select()
                        .from(tags)
                        .where(eq(tags.id, tagId))
                        .limit(1);
                }

                if (existingTag) {
                    await db.insert(contentTags).values({
                        contentId,
                        tagId: existingTag.id,
                    });
                }
            }
        }

        /** Step 4: Handle Artist (link content to artist) */
        if (artistName.trim()) {
            const normalizedArtist = artistName.trim();
            let [existingArtist] = await db
                .select()
                .from(artists)
                .where(eq(artists.name, normalizedArtist))
                .limit(1);

            if (!existingArtist) {
                const artistId = crypto.randomUUID();
                await db.insert(artists).values({
                    id: artistId,
                    name: normalizedArtist,
                });
                [existingArtist] = await db
                    .select()
                    .from(artists)
                    .where(eq(artists.id, artistId))
                    .limit(1);
            }

            if (existingArtist) {
                await db.insert(contentArtists).values({
                    contentId,
                    artistId: existingArtist.id,
                    role: "author",
                });
            }
        }

        return NextResponse.json({ success: true, contentId });
    } catch (e: any) {
        console.error("Upload error:", e);
        return NextResponse.json(
            { error: "Upload failed: " + e.message },
            { status: 500 }
        );
    }
}


