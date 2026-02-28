"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AssetHeader } from "@/components/AssetHeader";
import { EditMetadataDrawer } from "@/components/EditMetadataDrawer";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ShowViewProps {
    userRole: string;
    isSaved: boolean;
    availableTags: { name: string }[];
    availableArtists: { name: string }[];
    showData: {
        id: string;
        title: string;
        description: string | null;
        uploader: string;
        artistName: string;
        viewCount: number;
        tags: string[];
        episodes: any[];
        currentEpisode: any;
    };
}

/**
 * Client-side view for the show/series asset page.
 * @param props - Component properties
 * @returns React component with episode playlist
 */
export function ShowView({
    userRole,
    isSaved,
    availableTags,
    availableArtists,
    showData,
}: ShowViewProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-6xl mx-auto mt-32 px-4 pb-32 flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    <AssetHeader
                        id={showData.id}
                        title={showData.title}
                        isSaved={isSaved}
                        uploader={showData.uploader}
                        artistName={showData.artistName}
                        onEditClick={() => setDrawerOpen(true)}
                        typeLabel="Serial Video"
                    />

                    <p className="mt-2 opacity-50 text-xs font-tactical mb-4 text-white">
                        EPISODE: {showData.currentEpisode?.sequence || "01"} //{" "}
                        {showData.currentEpisode?.title}
                    </p>

                    <VideoPlayer
                        src={showData.currentEpisode?.src || ""}
                        title={showData.currentEpisode?.title || showData.title}
                        type={showData.currentEpisode?.mimeType || "video/mp4"}
                    />

                    <div className="mt-8 glass-panel p-6 rounded-2xl mb-16 grid grid-cols-1 md:grid-cols-3 gap-8 bg-black/20 border border-white/10">
                        <div className="md:col-span-2">
                            <h3 className="font-tactical uppercase text-xs opacity-50 mb-2 tracking-widest text-white">
                                {showData.currentEpisode?.title || "Series_Log"}
                            </h3>
                            <p className="text-sm opacity-80 leading-relaxed max-w-2xl text-white">
                                {showData.description ||
                                    "This layout is organized for episodic viewing. Select episodes from the playlist index aside."}
                            </p>
                        </div>

                        {/* Meta & Tags */}
                        <div className="space-y-6 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 text-white">
                            <div>
                                <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-3 tracking-[0.2em] border-b border-white/10 pb-1 text-white">
                                    Series_Meta
                                </h3>
                                <ul className="space-y-2 text-xs font-tactical opacity-80 uppercase text-white">
                                    <li className="flex justify-between">
                                        <span className="opacity-50">Episodes</span>{" "}
                                        <span>{showData.episodes.length}_Total</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="opacity-50">Views</span>{" "}
                                        <span>{showData.viewCount + 1}</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-3 tracking-[0.2em] border-b border-white/10 pb-1 text-white">
                                    Series_Tags
                                </h3>
                                <div className="flex flex-wrap gap-2 text-white">
                                    {showData.tags.map((tag) => (
                                        <a
                                            key={tag}
                                            href={`/search?tags=${tag}`}
                                            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-tactical uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                                        >
                                            {tag}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Episode Tracker / Playlist */}
                <aside className="w-full lg:w-80 space-y-4">
                    <h3 className="font-tactical uppercase text-xs opacity-50 tracking-[0.3em] border-b border-white/10 pb-2 text-white">
                        Playlist_Index
                    </h3>

                    <div className="flex flex-col gap-2">
                        {showData.episodes.map((ep) => (
                            <a
                                key={ep.id}
                                href={`?ep=${ep.id}`}
                                className={cn(
                                    "flex justify-between items-center p-3 rounded-xl glass-panel border border-white/5 transition-all outline-none text-white",
                                    ep.id === showData.currentEpisode?.id
                                        ? "bg-white/10 border-white/30"
                                        : "hover:bg-white/5 opacity-60"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-tactical opacity-50">
                                        {String(ep.sequence || 0).padStart(2, "0")}
                                    </span>
                                    <span className="text-xs font-tactical tracking-widest truncate max-w-[180px]">
                                        {ep.title}
                                    </span>
                                </div>
                            </a>
                        ))}
                        {showData.episodes.length === 0 && (
                            <div className="p-8 text-center opacity-20 font-tactical text-[10px] uppercase text-white">
                                No_Episodes_Linked
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            <EditMetadataDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                contentId={showData.id}
                initialData={{
                    title: showData.title,
                    description: showData.description || "",
                    artistName: showData.artistName || "",
                    tags: showData.tags,
                }}
                availableTags={availableTags}
                availableArtists={availableArtists}
            />
        </>
    );
}
