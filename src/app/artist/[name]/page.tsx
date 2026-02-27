import { db } from "@/db";
import { files, users, content } from "@/db/schema";
import { eq, ne, desc, and, sql } from "drizzle-orm";
import { getFileUrl } from "@/lib/r2";
import { Navigation } from "@/components/Navigation";
import { VideoCard } from "@/components/VideoCard";
import { ImageCard } from "@/components/ImageCard";
import { redirect } from "next/navigation";
import { User as UserIcon } from "lucide-react";
import { auth } from "@/lib/auth/server";

import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Artist profile page.
 * Displays all works uploaded by or associated with a specific artist/user.
 * @param props - Component properties with params
 * @returns Artist page React component
 */
export default async function ArtistPage(props: {
    params: Promise<{ name: string }>;
    searchParams: Promise<{ page?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const name = params.name;
    const pageParam = searchParams.page;
    const currentPage = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const ITEMS_PER_PAGE = 24;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Fetch Artist Info from our users table (where creators are registered)
    const [artist] = await db
        .select()
        .from(users)
        .where(eq(users.username, name))
        .limit(1);

    if (!artist) {
        redirect("/404");
    }

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";

    // Base Conditions
    const conditions = and(
        eq(content.uploaderId, artist.id),
        ne(content.category, "SYSTEM"),
        ne(content.category, "thumbnail"),
        eq(content.status, "active")
    );

    // Fetch Total Count
    const [{ count: totalCount }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(content)
        .where(conditions);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

    // Fetch Artist's Works
    const artistWorksQuery = await db
        .select({
            id: content.id,
            title: content.name,
            category: content.category,
            mimeType: files.mimeType,
            objectKey: files.objectKey,
        })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .where(conditions)
        .orderBy(desc(content.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);

    const artistWorks = await Promise.all(
        artistWorksQuery.map(async (f) => {
            const isVideo = f.mimeType?.startsWith("video") || f.category === "show";
            return {
                id: f.id,
                title: f.title,
                thumbnailUrl: await getFileUrl(f.objectKey || ""),
                artist: artist.username,
                type: isVideo ? "Video" : f.category,
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

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
                {/* Artist Header */}
                <header className="mb-16 glass-panel p-8 rounded-xl border border-white/20 relative overflow-hidden">

                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                        <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {artist.avatarUrl ? (
                                <img
                                    src={artist.avatarUrl}
                                    alt={artist.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-8 h-8 opacity-20" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-tactical font-bold tracking-tighter uppercase italic mb-2">
                                @{name}
                            </h1>
                            <p className="font-tactical text-[10px] uppercase tracking-[0.2em] opacity-40 mb-4">
                                Class: Creator // Initialized:{" "}
                                {artist.createdAt ? new Date(artist.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <section>
                    <div className="mb-8 flex justify-between items-end border-l-2 border-white/20 pl-6 text-white">
                        <div>
                            <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30">
                                Artist Database
                            </p>
                            <h2 className="text-2xl font-tactical font-bold tracking-tighter uppercase italic">
                                Total_Archive
                            </h2>
                        </div>
                        <div className="text-right opacity-20 font-tactical text-[8px] uppercase tracking-widest">
                            Count: {totalCount}_Items
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-white mb-20">
                        {artistWorks.map((item, i) =>
                            item.isVideo ? (
                                <div key={item.id} className="col-span-2 md:col-span-1">
                                    <VideoCard
                                        id={item.id}
                                        title={item.title}
                                        artist={name || "Unknown"}
                                        type={item.type || ""}
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
                                        artist={name || "Unknown"}
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
                        <span className="font-tactical text-[9px] opacity-30 uppercase tracking-widest">
                            Index: {String(currentPage).padStart(2, "0")} /{" "}
                            {String(totalPages).padStart(2, "0")}
                        </span>
                        <div className="flex">
                            {currentPage > 1 && (
                                <Link
                                    href={`?page=${currentPage - 1}`}
                                    className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase"
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
                                    className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
