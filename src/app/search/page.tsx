import { db } from "@/db";
import { content, files, contentTags, users, tags as tagsTable, contentStats, artists, contentArtists } from "@/db/schema";

import { eq, ne, or, desc, like, isNull, and, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getFileUrl, getVideoAssets } from "@/lib/r2";
import { Navigation } from "@/components/Navigation";
import { VideoCard } from "@/components/VideoCard";
import { ImageCard } from "@/components/ImageCard";
import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Search page component.
 * @param props - Component properties including searchParams
 * @returns Search results React component
 */
export default async function SearchPage(props: {
    searchParams: Promise<{
        q?: string;
        artist?: string;
        tags?: string;
        type?: string;
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const q = searchParams.q || "";
    const artistName = searchParams.artist || "";
    const tagsParam = searchParams.tags || "";
    const type = searchParams.type || "";
    const pageParam = searchParams.page;
    const currentPage = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const ITEMS_PER_PAGE = 24;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const thumbnails = alias(files, "thumbnails");

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";

    // Build Query
    let conditions = [
        eq(content.status, "active"),
        eq(content.visibility, "public"),
    ];

    if (q) {
        conditions.push(
            or(like(content.name, `%${q}%`), like(content.description, `%${q}%`))!
        );
    }

    if (artistName) {
        conditions.push(sql`EXISTS (
            SELECT 1 FROM ${contentArtists} ca
            JOIN ${artists} a ON ca.artist_id = a.id
            WHERE ca.content_id = ${content.id} AND a.name = ${artistName}
        )`);
    }

    if (tagsParam) {
        const tagList = tagsParam
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0);
        if (tagList.length > 0) {
            conditions.push(sql`(
        SELECT COUNT(DISTINCT t.id) 
        FROM ${contentTags} ct 
        JOIN ${tagsTable} t ON ct.tag_id = t.id 
        WHERE ct.content_id = ${content.id} AND LOWER(t.name) IN (${sql.join(
                tagList.map((t) => sql`${t}`),
                sql`, `
            )})
      ) = ${tagList.length}`);
        }
    }

    if (type === "video") {
        conditions.push(
            or(like(files.mimeType, "video/%"), eq(content.category, "show"))!
        );
    } else if (type === "image") {
        conditions.push(
            or(
                like(files.mimeType, "image/%"),
                eq(content.category, "comic"),
                eq(content.category, "series"),
                eq(content.category, "gallery")
            )!
        );
    }

    const resultsCountQuery = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .where(and(...conditions));

    const totalResults = resultsCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE) || 1;

    const resultsQuery = await db
        .select({
            id: content.id,
            name: content.name,
            category: content.category,
            mimeType: files.mimeType,
            objectKey: files.objectKey,
            uploader: users.username,
            processedMetadata: content.processedMetadata,
        })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .where(and(...conditions))
        .orderBy(desc(content.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);

    const results = await Promise.all(
        resultsQuery.map(async (f) => {
            // Fetch all artists for this content
            const contentArtistsResults = await db
                .select({ name: artists.name })
                .from(contentArtists)
                .innerJoin(artists, eq(contentArtists.artistId, artists.id))
                .where(eq(contentArtists.contentId, f.id));

            const artistDisplay = contentArtistsResults.length > 0
                ? contentArtistsResults.map(a => a.name).join(", ")
                : "Unknown Artist";

            const isVideo = f.mimeType?.startsWith("video") || f.category === "show";
            const assets = await getVideoAssets(f.objectKey, f.processedMetadata);

            return {
                ...f,
                thumbnailUrl: assets.poster || assets.src || "/placeholder.png",
                previewUrl: assets.preview,
                uploader: f.uploader || "Unknown",
                artist: artistDisplay,
                type: isVideo
                    ? "Video"
                    : f.mimeType?.startsWith("image")
                        ? "Image"
                        : f.category || "Asset",
                res: "SRC",
                isVideo,
                isSerial:
                    f.category === "show" ||
                    f.category === "comic" ||
                    f.category === "gallery" ||
                    f.category === "series",
            };
        })
    );

    // Helper for pagination links
    const getPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (artistName) params.set("artist", artistName);
        if (tagsParam) params.set("tags", tagsParam);
        if (type) params.set("type", type);
        params.set("page", String(pageNumber));
        return `?${params.toString()}`;
    };

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
                <header className="mb-16 border-l-2 border-white/20 pl-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                            Search_Result
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                            {q ? `Query: ${q}` : "All_Assets"}
                            {(artistName || tagsParam) && (
                                <div className="opacity-30 text-lg flex flex-col gap-1 mt-2">
                                    {artistName && <span>by @{artistName}</span>}
                                    {tagsParam && (
                                        <span className="text-[10px] tracking-widest uppercase italic">
                                            Tags: {tagsParam}
                                        </span>
                                    )}
                                </div>
                            )}
                        </h2>
                    </div>
                    <div className="text-[8px] font-tactical uppercase tracking-widest opacity-20 text-white">
                        Found: {totalResults}_Items
                    </div>
                </header>

                {results.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-white">
                            {results.map((item, i) =>
                                item.isVideo ? (
                                    <div key={item.id} className="col-span-2 md:col-span-1">
                                        <VideoCard
                                            id={item.id}
                                            title={item.name}
                                            artist={item.artist}
                                            type={item.type}
                                            res={item.res}
                                            isSerial={item.isSerial}
                                            thumbnailUrl={item.thumbnailUrl}
                                            previewUrl={item.previewUrl}
                                            delay={i * 0.05}
                                        />
                                    </div>
                                ) : (
                                    <div key={item.id} className="col-span-1">
                                        <ImageCard
                                            id={item.id}
                                            title={item.name}
                                            artist={item.artist}
                                            res={item.res}
                                            isSerial={item.isSerial}
                                            thumbnailUrl={item.thumbnailUrl}
                                            delay={i * 0.05}
                                        />
                                    </div>
                                )
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="mt-32 flex items-center justify-between border-t border-white/5 pt-10">
                            <span className="font-tactical text-[9px] opacity-30 uppercase tracking-widest text-white">
                                Index: {String(currentPage).padStart(2, "0")} /{" "}
                                {String(totalPages).padStart(2, "0")}
                            </span>
                            <div className="flex">
                                {currentPage > 1 && (
                                    <Link
                                        href={getPageUrl(currentPage - 1)}
                                        className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase text-white"
                                    >
                                        Prev
                                    </Link>
                                )}
                                <div className="w-10 h-10 border border-white bg-white text-black flex items-center justify-center font-tactical text-[10px] tabular-nums">
                                    {String(currentPage).padStart(2, "0")}
                                </div>
                                {currentPage < totalPages && (
                                    <Link
                                        href={getPageUrl(currentPage + 1)}
                                        className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase text-white"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-40 text-center glass-panel rounded-2xl border border-dashed border-white/10 bg-black/20 text-white">
                        <p className="font-tactical text-xs uppercase tracking-[0.5em] opacity-20 mb-8">
                            No_Data_Matches_Query
                        </p>
                        <Link
                            href="/"
                            className="px-8 py-4 border border-white/20 text-[10px] font-tactical uppercase tracking-[0.3em] hover:bg-white/5 transition-colors"
                        >
                            Return_to_Core
                        </Link>
                    </div>
                )}
            </main>
        </>
    );
}
