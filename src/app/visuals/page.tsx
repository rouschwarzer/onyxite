import { db } from "@/db";
import { content, files, users } from "@/db/schema";
import { eq, or, desc, sql, and } from "drizzle-orm";
import { getFileUrl } from "@/lib/r2";
import { Navigation } from "@/components/Navigation";
import { ImageCard } from "@/components/ImageCard";
import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Visuals page component.
 * Displays a paginated grid of all image assets and series.
 * @param props - Component properties including searchParams
 * @returns Visuals directory React component
 */
export default async function VisualsPage(props: {
    searchParams: Promise<{ page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const pageParam = searchParams.page;
    const currentPage = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const ITEMS_PER_PAGE = 24;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const { data: session } = await auth.getSession();
    const userRole = session?.user?.role || "user";

    const verticalWhere = and(
        or(
            eq(content.category, "image"),
            eq(content.category, "comic"),
            eq(content.category, "gallery"),
            eq(content.category, "series")
        ),
        eq(content.visibility, "public")
    );

    // Fetch Images & Comics
    const verticalQuery = await db
        .select({
            id: content.id,
            title: content.name,
            category: content.category,
            mimeType: files.mimeType,
            objectKey: files.objectKey,
            uploader: users.username,
        })
        .from(content)
        .leftJoin(files, eq(content.fileId, files.id))
        .leftJoin(users, eq(content.uploaderId, users.id))
        .where(verticalWhere)
        .orderBy(desc(content.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);

    const [{ count: verticalCountRow }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(content)
        .where(verticalWhere);
    const totalPages = Math.ceil(verticalCountRow / ITEMS_PER_PAGE) || 1;

    const verticalData = await Promise.all(
        verticalQuery.map(async (f) => ({
            id: f.id,
            title: f.title,
            thumbnailUrl: await getFileUrl(f.objectKey || ""),
            artist: f.uploader || "Unknown",
            type: f.mimeType?.startsWith("image") ? "Image" : (f.category || "Image"),
            res: "SRC",
            isSerial:
                f.category === "comic" ||
                f.category === "gallery" ||
                f.category === "series",
        }))
    );

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
                <header className="mb-16 border-l-2 border-white/20 pl-6 flex justify-between items-end">
                    <div>
                        <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                            Static_Data
                        </p>
                        <h2 className="text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                            Visual_Database
                        </h2>
                    </div>
                    <div className="text-[8px] font-tactical uppercase tracking-widest opacity-20 text-white">
                        Total: {verticalCountRow}_Portraits
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {verticalData.map((item, i) => (
                        <ImageCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            artist={item.artist}
                            res={item.res}
                            isSerial={item.isSerial}
                            thumbnailUrl={item.thumbnailUrl}
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

