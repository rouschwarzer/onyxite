"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { AssetHeader } from "@/components/AssetHeader";
import { EditMetadataDrawer } from "@/components/EditMetadataDrawer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GalleryViewProps {
    userRole: string;
    isSaved: boolean;
    availableTags: { name: string }[];
    availableArtists: { name: string }[];
    galleryData: {
        id: string;
        title: string;
        description: string | null;
        uploader: string;
        artistName: string | null;
        viewCount: number;
        filesize: string;
        mintedDate: string;
        tags: string[];
        pages: string[];
    };
}

/**
 * Client-side view for the gallery/comic asset page.
 * @param props - Component properties
 * @returns React component with reader functionality
 */
export function GalleryView({
    userRole,
    isSaved,
    availableTags,
    availableArtists,
    galleryData,
}: GalleryViewProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const totalPages = galleryData.pages.length;

    const goNext = () => {
        if (currentPageIndex < totalPages - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
            window.scrollTo({ top: 500, behavior: "smooth" });
        }
    };

    const goPrev = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
            window.scrollTo({ top: 500, behavior: "smooth" });
        }
    };

    return (
        <>
            <Navigation userRole={userRole} />

            <main className="max-w-4xl mx-auto mt-32 px-4 pb-32">
                <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col md:flex-row gap-8 bg-black/20 border border-white/10">
                    {/* Cover Image */}
                    <div className="w-full md:w-1/3 aspect-[3/4] rounded-xl overflow-hidden relative flex-shrink-0">
                        <img
                            src={galleryData.pages[0]}
                            alt="Cover"
                            className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none"></div>
                        <div className="absolute top-3 right-3 bg-black/80 px-2 py-1 text-[8px] font-tactical tracking-[0.2em] rounded border border-white/10 uppercase text-white">
                            VOL_01
                        </div>
                    </div>

                    {/* Meta Information */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                                Serial Archive
                            </p>
                            <AssetHeader
                                id={galleryData.id}
                                title={galleryData.title}
                                isSaved={isSaved}
                                uploader={galleryData.uploader}
                                artistName={galleryData.artistName || "UNKNOWN"}
                                onEditClick={() => setDrawerOpen(true)}
                                typeLabel="Serial Archive"
                            />

                            <div className="mb-8">
                                <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-2 tracking-[0.2em] text-white">
                                    Log_Entry
                                </h3>
                                <p className="text-[12px] opacity-70 leading-relaxed max-w-xl whitespace-pre-wrap text-white">
                                    {galleryData.description ||
                                        "No database description linked for this serial volume."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-3 tracking-[0.2em] border-b border-white/10 pb-1 text-white">
                                        Archive_Spec
                                    </h3>
                                    <ul className="space-y-2 text-[10px] font-tactical opacity-80 uppercase text-white">
                                        <li className="flex justify-between">
                                            <span className="opacity-50">Pages</span>{" "}
                                            <span>{totalPages} PG</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="opacity-50">Filesize</span>{" "}
                                            <span>{galleryData.filesize}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="opacity-50">Minted</span>{" "}
                                            <span>{galleryData.mintedDate}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-tactical uppercase text-[10px] opacity-40 mb-3 tracking-[0.2em] border-b border-white/10 pb-1 text-white">
                                        Index_Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5 line-clamp-2">
                                        {galleryData.tags.length > 0 ? (
                                            galleryData.tags.map((tag) => (
                                                <a
                                                    key={tag}
                                                    href={`/search?tags=${tag}`}
                                                    className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-tactical uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-white/10 transition-all text-white"
                                                >
                                                    {tag}
                                                </a>
                                            ))
                                        ) : (
                                            <span className="text-[8px] opacity-20 uppercase text-white">
                                                No_Tags
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <a
                                href="#reader"
                                className="inline-block w-full text-center px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-tactical font-bold tracking-[0.3em] uppercase text-[10px] rounded-lg"
                            >
                                Scan_Archive // Read
                            </a>
                        </div>
                    </div>
                </div>

                <div
                    id="reader"
                    className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-16"
                ></div>

                <div className="flex justify-between items-center mb-6 text-white">
                    <span className="font-tactical text-[10px] uppercase tracking-[0.3em] opacity-40">
                        Active_View
                    </span>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded px-2 py-1">
                        <button
                            onClick={goPrev}
                            disabled={currentPageIndex === 0}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-opacity",
                                currentPageIndex === 0 ? "opacity-10 cursor-not-allowed" : "opacity-60"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-tactical text-[10px] tracking-[0.2em] w-12 text-center">
                            PG_{String(currentPageIndex + 1).padStart(2, "0")}
                        </span>
                        <button
                            onClick={goNext}
                            disabled={currentPageIndex === totalPages - 1}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-opacity",
                                currentPageIndex === totalPages - 1
                                    ? "opacity-10 cursor-not-allowed"
                                    : "opacity-60"
                            )}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="w-full relative shadow-2xl glass-panel p-2 rounded-xl mb-6 bg-black/20 border border-white/10">
                    <img
                        src={galleryData.pages[currentPageIndex]}
                        alt={`Page ${currentPageIndex + 1}`}
                        className="w-full h-auto rounded border border-white/10"
                    />
                </div>

                <div className="flex justify-between items-center mb-16 text-white">
                    <Link
                        href="/"
                        className="text-[9px] font-tactical uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
                    >
                        Return_Index
                    </Link>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded px-2 py-1">
                        <button
                            onClick={goPrev}
                            disabled={currentPageIndex === 0}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-opacity",
                                currentPageIndex === 0 ? "opacity-10 cursor-not-allowed" : "opacity-60"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goNext}
                            disabled={currentPageIndex === totalPages - 1}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-opacity",
                                currentPageIndex === totalPages - 1
                                    ? "opacity-10 cursor-not-allowed"
                                    : "opacity-60"
                            )}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </main>

            <EditMetadataDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                contentId={galleryData.id}
                initialData={{
                    title: galleryData.title,
                    description: galleryData.description || "",
                    artistName: galleryData.artistName || "",
                    tags: galleryData.tags,
                }}
                availableTags={availableTags}
                availableArtists={availableArtists}
            />
        </>
    );
}
