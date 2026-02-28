import { db } from "@/db";
import { content, files, bookmarks, contentTags, users, tags as tagsTable, contentStats, artists, contentArtists } from "@/db/schema";

import { eq, and, sql } from "drizzle-orm";
import { getFileUrl, getVideoAssets } from "@/lib/r2";
import { redirect } from "next/navigation";
import { VideoView } from "./VideoView";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Video asset page.
 * Fetches data on the server and passes to VideoView.
 * @param props - Component properties with params
 * @returns Video page React component
 */
export default async function VideoPage(props: {
    params: Promise<{ uuid: string }>;
}) {
    const params = await props.params;
    const uuid = params.uuid;

    if (!uuid) redirect("/404");

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";
    const userId = session?.user?.id;

    // 1. Fetch Content & File Details
    const [contentData] = await db
        .select({
            id: content.id,
            title: content.name,
            description: content.description,
            objectKey: files.objectKey,
            sizeBytes: files.sizeBytes,
            mimeType: files.mimeType,
            viewCount: contentStats.viewCount,
            createdAt: content.createdAt,
            uploader: users.username,
            artistName: artists.name,
            processedMetadata: content.processedMetadata,
        })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .leftJoin(contentStats, eq(content.id, contentStats.contentId))
        .leftJoin(contentArtists, eq(content.id, contentArtists.contentId))
        .leftJoin(artists, eq(contentArtists.artistId, artists.id))
        .where(eq(content.id, uuid))
        .limit(1);


    if (!contentData) redirect("/404");

    // 2. Check if bookmarked
    let isSaved = false;
    if (userId) {
        const [bookmark] = await db
            .select()
            .from(bookmarks)
            .where(and(eq(bookmarks.userId, userId), eq(bookmarks.contentId, uuid)))
            .limit(1);
        isSaved = !!bookmark;
    }

    // 3. Increment views
    await db
        .insert(contentStats)
        .values({ contentId: uuid, viewCount: 1 })
        .onConflictDoUpdate({
            target: contentStats.contentId,
            set: { viewCount: sql`${contentStats.viewCount} + 1`, updatedAt: new Date() }
        });

    // 4. Construct R2 URLs using helper
    const assets = await getVideoAssets(
        contentData.objectKey,
        contentData.processedMetadata
    );

    // 5. Fetch Tags
    const tagsQuery = await db
        .select({
            name: tagsTable.name,
        })
        .from(contentTags)
        .innerJoin(tagsTable, eq(contentTags.tagId, tagsTable.id))
        .where(eq(contentTags.contentId, uuid));

    const currentTags = tagsQuery.map((t) => t.name);

    // 6. Fetch All Tags for Editing
    const allTags = await db
        .select({ name: tagsTable.name })
        .from(tagsTable)
        .orderBy(tagsTable.name);

    // 6.5 Fetch All Artists for Editing
    const allArtists = await db
        .select({ name: artists.name })
        .from(artists)
        .orderBy(artists.name);

    // 7. Format metadata
    const filesize = contentData.sizeBytes
        ? `${(contentData.sizeBytes / 1024 / 1024).toFixed(2)} MB`
        : "UNKNOWN_SIZE";

    const mintedDate = contentData.createdAt
        ? new Date(contentData.createdAt as any).toLocaleDateString("en-US", {
            year: "numeric", month: "2-digit", day: "2-digit"
        })
        : "N/A";

    return (
        <VideoView
            userRole={userRole}
            isSaved={isSaved}
            availableTags={allTags}
            availableArtists={allArtists}
            fileData={{
                id: contentData.id,
                title: contentData.title,
                description: contentData.description,
                uploader: contentData.uploader || "Unknown",
                artistName: contentData.artistName || "Unknown Artist",
                mimeType: contentData.mimeType,
                ...assets,
                viewCount: contentData.viewCount || 0,
                filesize,
                mintedDate,
                codec: "AVC/HEVC", // Placeholder
                tags: currentTags,
            }}
        />
    );
}

