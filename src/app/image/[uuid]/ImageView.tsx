"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { AssetHeader } from "@/components/AssetHeader";
import { EditMetadataDrawer } from "@/components/EditMetadataDrawer";

interface ImageViewProps {
    userRole: string;
    isSaved: boolean;
    availableTags: { name: string }[];
    availableArtists: { name: string }[];
    fileData: {
        id: string;
        title: string;
        description: string | null;
        uploader: string;
        artistName: string | null;
        src: string;
        viewCount: number;
        filesize: string;
        mintedDate: string;
        resolution: string;
        tags: string[];
    };
}

/**
 * Client-side view for the image asset page.
 * @param props - Component properties
 * @returns React component
 */
export function ImageView({
    userRole,
    isSaved,
    availableTags,
    availableArtists,
    fileData,
}: ImageViewProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-5xl mx-auto mt-32 px-4 pb-32">
                <AssetHeader
                    id={fileData.id}
                    title={fileData.title}
                    isSaved={isSaved}
                    uploader={fileData.uploader}
                    artistName={fileData.artistName || "UNKNOWN"}
                    onEditClick={() => setDrawerOpen(true)}
                    typeLabel="Single Render"
                />

                <div className="w-full relative shadow-2xl glass-panel p-2 rounded-xl">
                    <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none z-10"></div>
                    <img
                        src={fileData.src}
                        alt={fileData.title}
                        className="w-full h-auto rounded border border-white/10 relative z-0"
                    />

                    {/* Overlay UI */}
                    <div className="absolute top-6 right-6 bg-black/60 backdrop-blur px-3 py-1.5 rounded border border-white/10 z-20">
                        <span className="text-[9px] font-tactical tracking-[0.2em] opacity-80 uppercase text-white shadow-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            {fileData.resolution} // STATIC
                        </span>
                    </div>
                </div>

                <div className="mt-8 glass-panel p-6 rounded-xl mb-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <h3 className="font-tactical uppercase text-xs opacity-50 mb-4 tracking-widest text-white">
                            Description_Log
                        </h3>
                        <p className="text-sm opacity-80 leading-relaxed max-w-2xl whitespace-pre-wrap text-white">
                            {fileData.description ||
                                "No description provided for this visual asset."}
                        </p>
                    </div>

                    {/* Meta & Tags */}
                    <div className="space-y-6 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                        <div>
                            <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-3 tracking-[0.2em] border-b border-white/10 pb-1 text-white">
                                Extracted_Meta
                            </h3>
                            <ul className="space-y-2 text-xs font-tactical opacity-80 uppercase text-white">
                                <li className="flex justify-between">
                                    <span className="opacity-50">Resolution</span>{" "}
                                    <span>{fileData.resolution}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="opacity-50">Filesize</span>{" "}
                                    <span>{fileData.filesize}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="opacity-50">Minted</span>{" "}
                                    <span>{fileData.mintedDate}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="opacity-50">Views</span>{" "}
                                    <span>{fileData.viewCount + 1}</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-3 tracking-[0.2em] border-b border-white/10 pb-1 text-white">
                                Index_Tags
                            </h3>
                            <div className="flex flex-wrap gap-2 text-white">
                                {fileData.tags.length > 0 ? (
                                    fileData.tags.map((tag) => (
                                        <a
                                            key={tag}
                                            href={`/search?tags=${tag}`}
                                            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-tactical uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-white/10 transition-all text-white"
                                        >
                                            {tag}
                                        </a>
                                    ))
                                ) : (
                                    <span className="text-[9px] opacity-20 uppercase">
                                        No_Tags_Linked
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <EditMetadataDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                contentId={fileData.id}
                initialData={{
                    title: fileData.title,
                    description: fileData.description || "",
                    artistName: fileData.artistName || "",
                    tags: fileData.tags,
                }}
                availableTags={availableTags}
                availableArtists={availableArtists}
            />
        </>
    );
}
