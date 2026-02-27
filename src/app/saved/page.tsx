import { db } from "@/db";
import { files, bookmarks, users, content, artists, contentArtists } from "@/db/schema";

import { eq, desc, and, isNull, ne, sql } from "drizzle-orm";
import { getFileUrl, getVideoAssets } from "@/lib/r2";

import { Navigation } from "@/components/Navigation";
import { VideoCard } from "@/components/VideoCard";
import { ImageCard } from "@/components/ImageCard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Saved page component for bookmarks.
 * @param props - Component properties with searchParams
 * @returns Saved items React component
 */
export default async function SavedPage(props: {
    searchParams: Promise<{ page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const pageParam = searchParams.page;
    const currentPage = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const ITEMS_PER_PAGE = 24;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const { data: session } = await auth.getSession();

    if (!session?.user) {
        redirect("/login");
    }

    const userId = session.user.id;
    const userRole = session.user.role || "user";

    // Base Conditions
    const conditions = and(
        eq(bookmarks.userId, userId),
        eq(content.status, "active")
    );

    // Fetch Total Count
    const [{ count: totalCount }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(bookmarks)
        .innerJoin(content, eq(bookmarks.contentId, content.id))
        .leftJoin(files, eq(content.fileId, files.id))
        .where(conditions);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

    // Fetch Bookmarked Files
    const savedFilesQuery = await db
        .select({
            id: content.id,
            name: content.name,
            category: content.category,
            mimeType: files.mimeType,
            objectKey: files.objectKey,
            uploader: users.username,
            artist: artists.name,
            processedMetadata: content.processedMetadata,

        })
        .from(bookmarks)
        .innerJoin(content, eq(bookmarks.contentId, content.id))
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .leftJoin(contentArtists, eq(content.id, contentArtists.contentId))
        .leftJoin(artists, eq(contentArtists.artistId, artists.id))

        .where(conditions)
        .orderBy(desc(bookmarks.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);



    const savedFiles = await Promise.all(
        savedFilesQuery.map(async (f) => {
            const isVideo = f.mimeType?.startsWith("video") || f.category === "show";
            const assets = await getVideoAssets(f.objectKey, f.processedMetadata);

            return {
                ...f,
                title: f.name,
                thumbnailUrl: assets.poster || assets.src || "/placeholder.png",
                previewUrl: assets.preview,
                artist: f.artist || f.uploader || "Unknown",

                type: isVideo ? "Video" : f.category || "Asset",
                res: "SRC",
                isVideo,
                isSerial:
                    f.category === "show" ||
                    f.category === "series" ||
                    f.category === "comic" ||
                    f.category === "gallery",
            };
        })
    );


    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
                <header className="mb-16 border-l-2 border-white/20 pl-6">
                    <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                        User Cache
                    </p>
                    <h1 className="text-4xl font-tactical font-bold tracking-tighter uppercase italic mb-2 text-white">
                        Saved_Archives
                    </h1>
                    <div className="text-[10px] tracking-widest opacity-40 uppercase font-tactical flex items-center gap-2 text-white">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        Local_Bookmarked_Assets
                    </div>
                </header>

                <section>
                    {savedFiles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-white mb-20">
                                {savedFiles.map((item, i) =>
                                    item.category === "video" || item.category === "show" ? (
                                        <div key={item.id} className="col-span-2 md:col-span-1">
                                            <VideoCard
                                                id={item.id}
                                                title={item.title}
                                                artist={item.artist}
                                                type={item.type}
                                                res={item.res}
                                                isSerial={item.isSerial}
                                                thumbnailUrl={item.thumbnailUrl}
                                                delay={i * 0.1}
                                            />
                                        </div>
                                    ) : (
                                        <div key={item.id} className="col-span-1">
                                            <ImageCard
                                                id={item.id}
                                                title={item.title}
                                                artist={item.artist}
                                                res={item.res}
                                                isSerial={item.isSerial}
                                                thumbnailUrl={item.thumbnailUrl}
                                                delay={i * 0.1}
                                            />
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="mt-32 flex items-center justify-between border-t border-white/5 pt-10 text-white">
                                <span className="font-tactical text-[9px] opacity-30 uppercase tracking-widest text-white">
                                    Index: {String(currentPage).padStart(2, "0")} /{" "}
                                    {String(totalPages).padStart(2, "0")}
                                </span>
                                <div className="flex">
                                    {currentPage > 1 && (
                                        <Link
                                            href={`?page=${currentPage - 1}`}
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
                                            href={`?page=${currentPage + 1}`}
                                            className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase text-white"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-32 text-center glass-panel rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 bg-black/20 text-white">
                            <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                                <Bookmark className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <p className="font-tactical text-[10px] uppercase tracking-[0.3em] opacity-30 text-center">
                                No_Saved_Content_Detected
                                <br />
                                <span className="text-[8px] opacity-50">
                                    Bookmark assets to see them here
                                </span>
                            </p>
                            <Link
                                href="/"
                                className="mt-4 px-6 py-2 border border-white/20 text-[9px] font-tactical uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                            >
                                Explore_Archive
                            </Link>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
