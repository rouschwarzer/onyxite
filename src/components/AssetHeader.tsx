"use client";

import React, { useState } from "react";
import { Bookmark, Edit, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AssetHeaderProps {
    id: string;
    title: string;
    isSaved: boolean;
    uploader: string;
    artistName: string;
    onEditClick: () => void;
    typeLabel?: string;
}

/**
 * Common header for asset pages (video, image, gallery).
 * @param props - Component properties
 * @returns React component
 */
export function AssetHeader({
    id,
    title,
    isSaved: initialIsSaved,
    uploader,
    artistName,
    onEditClick,
    typeLabel = "Asset",
}: AssetHeaderProps) {
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isBookmarking, setIsBookmarking] = useState(false);

    const handleBookmark = async () => {
        if (isBookmarking) return;
        setIsBookmarking(true);

        try {
            const res = await fetch("/api/bookmark", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentId: id }),
            });


            if (res.ok) {
                const data = await res.json();
                setIsSaved(data.saved);
            }
        } catch (err) {
            console.error("Bookmark error:", err);
        } finally {
            setIsBookmarking(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `ONYXITE | ${title}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("URL copied to clipboard");
        }
    };

    return (
        <div className="mb-6 flex justify-between items-end border-l-2 border-white/20 pl-6 cursor-default">
            <div className="flex-1">
                <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30">
                    {typeLabel}
                </p>
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-tactical font-bold tracking-tighter uppercase italic text-white leading-tight">
                        {title}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBookmark}
                            disabled={isBookmarking}
                            className={cn(
                                "p-2 rounded border border-white/10 hover:bg-white/5 transition-all",
                                isSaved
                                    ? "text-blue-400 border-blue-500/30 bg-blue-500/5"
                                    : "text-white/40",
                                isBookmarking && "opacity-50"
                            )}
                        >
                            <Bookmark
                                className="w-[18px] h-[18px]"
                                fill={isSaved ? "currentColor" : "none"}
                                strokeWidth={2}
                            />
                        </button>
                        <button
                            onClick={onEditClick}
                            className="p-2 rounded border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white"
                        >
                            <Edit className="w-[18px] h-[18px]" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <Link
                    href={`/artist/${uploader}`}
                    className="block opacity-40 font-tactical text-[10px] uppercase tracking-widest hover:opacity-100 transition-opacity mb-1"
                >
                    Owner: @{uploader}
                </Link>
                <Link
                    href={`/search?q=${artistName || ""}`}
                    className="text-[10px] font-tactical uppercase tracking-[0.2em] text-blue-400 opacity-80 italic hover:opacity-100 transition-opacity"
                >
                    ARTIST: {artistName || "UNKNOWN"}
                </Link>
            </div>
        </div>
    );
}
