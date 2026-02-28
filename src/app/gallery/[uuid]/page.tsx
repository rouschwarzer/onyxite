import { db } from "@/db";
import { content, files, bookmarks, contentTags, users, tags as tagsTable, contentStats, artists, contentArtists, series, seriesItems } from "@/db/schema";


import { eq, and, asc, sql } from "drizzle-orm";
import { getFileUrl } from "@/lib/r2";
import { redirect } from "next/navigation";
import { GalleryView } from "./GalleryView";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Gallery / Comic asset page.
 * Fetches gallery root and sequence pages on the server.
 * @param props - Component properties with params
 * @returns Gallery page React component
 */
export default async function GalleryPage(props: {
    params: Promise<{ uuid: string }>;
}) {
    const params = await props.params;
    const uuid = params.uuid;

    if (!uuid) redirect("/404");

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";
    const userId = session?.user?.id;

    // 1. Fetch Main Gallery Content
    const [galleryData] = await db
        .select({
            id: content.id,
            title: content.name,
            description: content.description,
            objectKey: files.objectKey, // Can be cover
            sizeBytes: files.sizeBytes,
            viewCount: contentStats.viewCount,
            createdAt: content.createdAt,
            uploader: users.username,
            artistName: artists.name,
        })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .leftJoin(contentStats, eq(content.id, contentStats.contentId))
        .leftJoin(contentArtists, eq(content.id, contentArtists.contentId))
        .leftJoin(artists, eq(contentArtists.artistId, artists.id))
        .where(eq(content.id, uuid))
        .limit(1);


    if (!galleryData) redirect("/404");

    // Check if bookmarked
    let isSaved = false;
    if (userId) {
        const [bookmark] = await db
            .select()
            .from(bookmarks)
            .where(and(eq(bookmarks.userId, userId), eq(bookmarks.contentId, uuid)))
            .limit(1);
        isSaved = !!bookmark;
    }

    // Increment view count
    await db
        .insert(contentStats)
        .values({ contentId: uuid, viewCount: 1 })
        .onConflictDoUpdate({
            target: contentStats.contentId,
            set: { viewCount: sql`${contentStats.viewCount} + 1`, updatedAt: new Date() }
        });

    // 2. Fetch Sequence Children (The actual images inside this comic/gallery)
    // We look for a series associated with this content, then get its items.
    const [seriesData] = await db
        .select()
        .from(series)
        .where(eq(series.contentId, uuid))
        .limit(1);

    let pagesData: any[] = [];
    if (seriesData) {
        pagesData = await db
            .select({
                id: files.id,
                objectKey: files.objectKey,
            })
            .from(seriesItems)
            .innerJoin(files, eq(seriesItems.fileId, files.id))
            .where(eq(seriesItems.seriesId, seriesData.id))
            .orderBy(asc(seriesItems.orderIndex));
    }

    // Get URLs
    const coverUrl = await getFileUrl(galleryData.objectKey);
    const pageUrls = await Promise.all(
        pagesData.map((p) => getFileUrl(p.objectKey))
    );


    // If no children, fallback to cover at least
    const finalPages = pageUrls.length > 0 ? pageUrls : [coverUrl];

    // Fetch Tags
    const tagsQuery = await db
        .select({
            name: tagsTable.name,
        })
        .from(contentTags)
        .innerJoin(tagsTable, eq(contentTags.tagId, tagsTable.id))
        .where(eq(contentTags.contentId, uuid));

    const currentTags = tagsQuery.map((t) => t.name);

    // Fetch All Available Tags for Editing
    const allTags = await db
        .select({ name: tagsTable.name })
        .from(tagsTable)
        .orderBy(tagsTable.name);

    // Fetch All Available Artists for Editing
    const allArtists = await db
        .select({ name: artists.name })
        .from(artists)
        .orderBy(artists.name);

    const filesize = galleryData.sizeBytes
        ? `${(galleryData.sizeBytes / 1024 / 1024).toFixed(2)} MB`
        : "UNKNOWN_SIZE";
    const mintedDate = galleryData.createdAt
        ? new Date(galleryData.createdAt as any).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        : "N/A";


    return (
        <GalleryView
            userRole={userRole}
            isSaved={isSaved}
            availableTags={allTags}
            availableArtists={allArtists}
            galleryData={{
                id: galleryData.id,
                title: galleryData.title,
                description: galleryData.description,
                uploader: galleryData.uploader || "Unknown",
                artistName: galleryData.artistName || "Unknown Artist",
                viewCount: galleryData.viewCount || 0,
                filesize,
                mintedDate,
                tags: currentTags,
                pages: finalPages,
            }}
        />
    );
}
