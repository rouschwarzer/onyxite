import { db } from "@/db";
import { files, users, content } from "@/db/schema";
import { eq, or, desc, sql, and } from "drizzle-orm";
import { getFileUrl, getVideoAssets } from "@/lib/r2";
import { Navigation } from "@/components/Navigation";
import { VideoCard } from "@/components/VideoCard";
import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Streams page component.
 * Displays a paginated list of all video assets and shows.
 * @param props - Component properties including searchParams
 * @returns Streams directory React component
 */
export default async function StreamsPage(props: {
    searchParams: Promise<{ page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const pageParam = searchParams.page;
    const currentPage = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const ITEMS_PER_PAGE = 12;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";


    const streamWhere = and(
        or(eq(content.category, "video"), eq(content.category, "show")),
        eq(content.visibility, "public")
    );

    // Fetch Videos & Shows
    const streamQuery = await db
        .select({
            id: content.id,
            title: content.name,
            category: content.category,
            mimeType: files.mimeType,
            objectKey: files.objectKey,
            uploader: users.username,
            processedMetadata: content.processedMetadata,
        })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .where(streamWhere)
        .orderBy(desc(content.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);

    const [{ count: streamCountRow }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(content)
        .where(streamWhere);
    const totalPages = Math.ceil(streamCountRow / ITEMS_PER_PAGE) || 1;

    const streamData = await Promise.all(
        streamQuery.map(async (f) => {
            const assets = await getVideoAssets(f.objectKey, f.processedMetadata);
            return {
                id: f.id,
                title: f.title,
                thumbnailUrl: assets.poster || await getFileUrl(f.objectKey || ""),
                previewUrl: assets.preview,
                artist: f.uploader || "Unknown",
                type: f.mimeType?.startsWith("video") ? "Video" : (f.category || "Video"),
                res: "SRC",
                isSerial: f.category === "show" || f.category === "series",
            };
        })
    );

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
                <header className="mb-16 border-l-2 border-white/20 pl-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                            Full_Archive
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                            Stream_Database
                        </h2>
                    </div>
                    <div className="text-[8px] font-tactical uppercase tracking-widest opacity-20 text-white">
                        Total: {streamCountRow}_Assets
                    </div>
                </header>

                <div className="space-y-16">
                    {streamData.map((item, i) => (
                        <VideoCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            artist={item.artist}
                            type={item.type}
                            res={item.res}
                            isSerial={item.isSerial}
                            thumbnailUrl={item.thumbnailUrl}
                            previewUrl={item.previewUrl}
                            delay={i * 0.05}
                        />
                    ))}
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
            </main>
        </>
    );
}
