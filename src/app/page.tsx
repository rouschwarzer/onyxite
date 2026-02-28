import { db } from "@/db";
import { files, users, content, artists, contentArtists } from "@/db/schema";

import { eq, or, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getFileUrl, getVideoAssets } from "@/lib/r2";
import { Navigation } from "@/components/Navigation";
import { VideoCard } from "@/components/VideoCard";
import { ImageCard } from "@/components/ImageCard";
import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * The root Home page for ONYXITE.
 * Fetches media categorized by type and renders lists/grids.
 * @returns Home page React component
 */
export default async function Home() {
  const { data: session } = await auth.getSession();
  const userRole = session?.user?.role || "user";

  const thumbnails = alias(files, "thumbnails");

  // Individual videos (Content of type video)
  const streamWhere = and(
    eq(content.category, "video"),
    eq(content.visibility, "public")
  );

  // Individual images (Content of type image)
  const verticalWhere = and(
    eq(content.category, "image"),
    eq(content.visibility, "public")
  );

  // Manga Corner: content marked as comic/gallery/series
  const mangaWhere = and(
    or(
      eq(content.category, "comic"),
      eq(content.category, "gallery"),
      eq(content.category, "series")
    ),
    eq(content.visibility, "public")
  );

  // Stream Corner: content marked as show
  const streamCornerWhere = and(
    eq(content.category, "show"),
    eq(content.visibility, "public")
  );

  // Fetch Individual Videos
  const streamQuery = await db
    .select({
      id: content.id,
      title: content.name,
      category: content.category,
      mimeType: files.mimeType,
      objectKey: files.objectKey,
      uploader: users.username,
      artist: artists.name,
      processedMetadata: content.processedMetadata,
    })
    .from(content)
    .leftJoin(files, eq(content.fileId, files.id))
    .leftJoin(users, eq(content.uploaderId, users.id))
    .leftJoin(contentArtists, eq(content.id, contentArtists.contentId))
    .leftJoin(artists, eq(contentArtists.artistId, artists.id))

    .where(streamWhere)
    .orderBy(desc(content.createdAt))
    .limit(20);

  // Fetch Individual Images
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
    .limit(10);

  // Fetch Manga/Series Parents
  const mangaQuery = await db
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
    .where(mangaWhere)
    .orderBy(desc(content.createdAt))
    .limit(10);

  // Fetch Stream Corner (Shows)
  const streamCornerQuery = await db
    .select({
      id: content.id,
      title: content.name,
      category: content.category,
      mimeType: files.mimeType,
      objectKey: files.objectKey,
      uploader: users.username,
      artist: artists.name,
      processedMetadata: content.processedMetadata,
    })
    .from(content)
    .leftJoin(files, eq(content.fileId, files.id))
    .leftJoin(users, eq(content.uploaderId, users.id))
    .leftJoin(contentArtists, eq(content.id, contentArtists.contentId))
    .leftJoin(artists, eq(contentArtists.artistId, artists.id))

    .where(streamCornerWhere)
    .orderBy(desc(content.createdAt))
    .limit(10);

  // Map data and generate URLs
  const streamData = await Promise.all(
    streamQuery.map(async (f) => {
      const assets = await getVideoAssets(f.objectKey, f.processedMetadata);
      return {
        id: f.id,
        title: f.title,
        thumbnailUrl: assets.poster || "/placeholder.png",
        previewUrl: assets.preview,
        artist: f.artist || f.uploader || "Unknown",

        type: f.mimeType?.startsWith("video") ? "Video" : f.category || "Video",
        res: "SRC",
        isSerial: false,
      };
    })
  );

  const verticalData = await Promise.all(
    verticalQuery.map(async (f) => ({
      id: f.id,
      title: f.title,
      thumbnailUrl: await getFileUrl(f.objectKey || ""),
      artist: f.uploader || "Unknown",
      type: f.mimeType?.startsWith("image") ? "Image" : f.category || "Image",
      res: "SRC",
      isSerial: false,
    }))
  );

  const mangaData = await Promise.all(
    mangaQuery.map(async (f) => ({
      id: f.id,
      title: f.title,
      thumbnailUrl: await getFileUrl(f.objectKey || ""),
      artist: f.uploader || "Unknown",
      type: f.category || "Series",
      res: "SRC",
      isSerial: true,
    }))
  );

  const streamCornerData = await Promise.all(
    streamCornerQuery.map(async (f) => {
      const assets = await getVideoAssets(f.objectKey, f.processedMetadata);
      return {
        id: f.id,
        title: f.title,
        thumbnailUrl: assets.poster || "/placeholder.png",
        previewUrl: assets.preview,
        artist: f.uploader || "Unknown",
        type: "Show",
        res: "SRC",
        isSerial: true,
      };
    })
  );


  return (
    <>
      <Navigation userRole={userRole} />

      <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
        {/* SECTION 01: STREAM_LIST (Individual Videos) */}
        {streamData.length > 0 && (
          <section className="max-w-3xl mx-auto">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-l-2 border-white/20 pl-6 gap-4">
              <div>
                <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30">
                  Latest_Feed
                </p>
                <h2 className="text-3xl sm:text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                  Stream_List
                </h2>
              </div>
              <Link href="/streams" className="flex items-center gap-2 group">
                <span className="text-[8px] font-tactical uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity text-white">
                  View_All_Streams
                </span>
                <div className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-white transition-all"></div>
              </Link>
            </header>

            <div className="space-y-12">
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
                  delay={i * 0.1}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 02: VISUAL_GRID (Individual Images) */}
        {verticalData.length > 0 && (
          <section className="mt-48">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-l-2 border-white/20 pl-6 gap-4">
              <div>
                <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30">
                  Static_Assets
                </p>
                <h2 className="text-3xl sm:text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                  Visual_Grid
                </h2>
              </div>
              <Link href="/visuals" className="flex items-center gap-2 group">
                <span className="text-[8px] font-tactical uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity text-white">
                  Explore_Gallery
                </span>
                <div className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-white transition-all"></div>
              </Link>
            </header>

            <div className="grid grid-cols-2 gap-4 md:gap-8">
              {verticalData.map((item, i) => (
                <ImageCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  artist={item.artist}
                  res={item.res}
                  isSerial={item.isSerial}
                  thumbnailUrl={item.thumbnailUrl}
                  delay={i * 0.1 + 0.3}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 03: MANGA_CORNER (Series / Comics / Galleries) */}
        {mangaData.length > 0 && (
          <section className="mt-48">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-l-2 border-white/20 pl-6 gap-4">
              <div>
                <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30">
                  Serial_Archive
                </p>
                <h2 className="text-3xl sm:text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                  Manga_Corner
                </h2>
              </div>
              <Link href="/visuals" className="flex items-center gap-2 group">
                <span className="text-[8px] font-tactical uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity text-white">
                  Browse_Series
                </span>
                <div className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-white transition-all"></div>
              </Link>
            </header>

            <div className="grid grid-cols-2 gap-4 md:gap-8">
              {mangaData.map((item, i) => (
                <ImageCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  artist={item.artist}
                  res={item.res}
                  isSerial={item.isSerial}
                  thumbnailUrl={item.thumbnailUrl}
                  delay={i * 0.1 + 0.3}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 04: STREAM_CORNER (Shows / Video Series) */}
        {streamCornerData.length > 0 && (
          <section className="mt-48 max-w-3xl mx-auto">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-l-2 border-white/20 pl-6 gap-4">
              <div>
                <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30">
                  Serial_Streams
                </p>
                <h2 className="text-3xl sm:text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                  Stream_Corner
                </h2>
              </div>
              <Link href="/streams" className="flex items-center gap-2 group">
                <span className="text-[8px] font-tactical uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity text-white">
                  View_All_Shows
                </span>
                <div className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-white transition-all"></div>
              </Link>
            </header>

            <div className="space-y-12">
              {streamCornerData.map((item, i) => (
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
                  delay={i * 0.1}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

