import { db } from "@/db";
import { content, bookmarks, contentTags, users, tags as tagsTable, contentStats, series, seriesItems, files, artists, contentArtists } from "@/db/schema";

import { eq, and, asc, sql } from "drizzle-orm";
import { getFileUrl } from "@/lib/r2";
import { redirect } from "next/navigation";
import { ShowView } from "./ShowView";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Show / Series asset page.
 * Fetches content metadata and linked series items on the server.
 * @param props - Component properties with params and searchParams
 * @returns Show page React component
 */
export default async function ShowPage(props: {
    params: Promise<{ uuid: string }>;
    searchParams: Promise<{ ep?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const uuid = params.uuid;
    const epId = searchParams.ep;

    if (!uuid) redirect("/404");

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";
    const userId = session?.user?.id;

    // 1. Fetch Main Content Metadata
    const [showData] = await db
        .select({
            id: content.id,
            title: content.name,
            description: content.description,
            category: content.category,
            viewCount: contentStats.viewCount,
            createdAt: content.createdAt,
            uploader: users.username,
            artistName: artists.name,
        })
        .from(content)
        .leftJoin(users, eq(content.uploaderId, users.id))
        .leftJoin(contentStats, eq(content.id, contentStats.contentId))
        .leftJoin(contentArtists, eq(content.id, contentArtists.contentId))
        .leftJoin(artists, eq(contentArtists.artistId, artists.id))
        .where(eq(content.id, uuid))
        .limit(1);


    if (!showData) redirect("/404");

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

    // Increment view count in separate stats table
    await db
        .insert(contentStats)
        .values({ contentId: uuid, viewCount: 1 })
        .onConflictDoUpdate({
            target: contentStats.contentId,
            set: { viewCount: sql`${contentStats.viewCount} + 1`, updatedAt: new Date() }
        });

    // 2. Fetch Series Items (if it's a series/show)
    const [seriesData] = await db
        .select()
        .from(series)
        .where(eq(series.contentId, uuid))
        .limit(1);

    let episodes: any[] = [];
    if (seriesData) {
        const episodesData = await db
            .select({
                id: files.id,
                title: seriesItems.title,
                objectKey: files.objectKey,
                sequence: seriesItems.orderIndex,
                mimeType: files.mimeType,
            })
            .from(seriesItems)
            .innerJoin(files, eq(seriesItems.fileId, files.id))
            .where(eq(seriesItems.seriesId, seriesData.id))
            .orderBy(asc(seriesItems.orderIndex));

        episodes = await Promise.all(
            episodesData.map(async (e) => ({
                id: e.id,
                title: e.title || `Episode ${e.sequence}`,
                objectKey: e.objectKey,
                sequence: e.sequence,
                mimeType: e.mimeType,
                src: await getFileUrl(e.objectKey || ""),
            }))
        );
    } else {
        // Single file content
        const [singleFileData] = await db
            .select({
                id: files.id,
                objectKey: files.objectKey,
                mimeType: files.mimeType,
            })
            .from(content)
            .innerJoin(files, eq(content.fileId, files.id))
            .where(eq(content.id, uuid))
            .limit(1);

        if (singleFileData) {
            episodes = [{
                id: singleFileData.id,
                title: showData.title,
                objectKey: singleFileData.objectKey,
                sequence: 1,
                mimeType: singleFileData.mimeType,
                src: await getFileUrl(singleFileData.objectKey || ""),
            }];
        }
    }

    const currentEpisode = epId
        ? episodes.find(e => e.id === epId) || episodes[0]
        : episodes[0];

    // Fetch Tags
    const contentTagsQuery = await db
        .select({
            name: tagsTable.name,
        })
        .from(contentTags)
        .innerJoin(tagsTable, eq(contentTags.tagId, tagsTable.id))
        .where(eq(contentTags.contentId, uuid));

    const currentTags = contentTagsQuery.map((t) => t.name);

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

    return (
        <ShowView
            userRole={userRole}
            isSaved={isSaved}
            availableTags={allTags}
            availableArtists={allArtists}
            showData={{
                id: showData.id,
                title: showData.title,
                description: showData.description,
                uploader: showData.uploader || 'Unknown',
                artistName: showData.artistName || 'Unknown Artist',
                viewCount: showData.viewCount || 0,
                tags: currentTags,
                episodes,
                currentEpisode
            }}
        />
    );
}

