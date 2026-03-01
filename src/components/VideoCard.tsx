"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MoreHorizontal, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
    id: string;
    title: string;
    artist: string;
    type: string;
    res: string;
    delay?: number;
    isSerial?: boolean;
    thumbnailUrl?: string;
    previewUrl?: string;
}

/**
 * VideoCard component for displaying video previews.
 * @param props - Component properties
 * @returns React component for video card
 */
export function VideoCard({
    id,
    title,
    artist,
    type,
    res,
    delay = 0,
    isSerial = false,
    thumbnailUrl,
    previewUrl,
}: VideoCardProps) {
    const link = isSerial ? `/show/${id}` : `/video/${id}`;
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Track intersection to play on mobile scroll
    useEffect(() => {
        if (!previewUrl) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting && entry.intersectionRatio > 0.6);
            },
            { threshold: [0, 0.6, 1.0] }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [previewUrl]);

    // Handle playback state changes
    useEffect(() => {
        if (!videoRef.current) return;

        const isMobile = "ontouchstart" in window;
        const shouldPlay = isHovered || (isMobile && isVisible);

        if (shouldPlay) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
            if (!isMobile) {
                videoRef.current.currentTime = 0;
            }
        }
    }, [isHovered, isVisible]);

    const showPreview = previewUrl && (isHovered || isVisible);

    return (
        <div
            ref={cardRef}
            className="block group tactical-card p-4 rounded-[20px] animate-in fade-in fill-mode-both relative"
            style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
        >
            <Link
                href={link}
                className="block"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="aspect-video bg-[#0a0a0a] rounded-lg mb-6 relative transition-transform duration-500 cursor-pointer overflow-hidden group-hover:scale-[0.985]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 z-10"></div>

                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10 z-20">
                        <span className="text-[8px] font-tactical tracking-[0.2em] opacity-80 uppercase text-white">
                            {type} // {res}
                        </span>
                    </div>

                    {previewUrl ? (
                        <div className="absolute inset-0 z-0">
                            <video
                                ref={videoRef}
                                src={previewUrl}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                className={cn(
                                    "w-full h-full object-cover transition-opacity duration-300",
                                    showPreview ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <img
                                src={thumbnailUrl}
                                alt={title}
                                className={cn(
                                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                                    showPreview ? "opacity-0" : "opacity-80"
                                )}
                            />
                        </div>
                    ) : thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity z-0 relative"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 font-tactical text-[8px] opacity-10 z-0 relative">
                            MEDIA_PLACEHOLDER
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                        <div className={cn(
                            "w-1 h-1 rounded-full transition-all duration-300",
                            showPreview ? "bg-emerald-500 animate-pulse scale-125" : "bg-white"
                        )}></div>
                        <span className="text-[8px] font-tactical uppercase tracking-widest opacity-40 italic text-white flex items-center gap-2">
                            {showPreview ? (
                                <>
                                    <Play className="w-2 h-2 fill-current" />
                                    SYNC_PREVIEW_ACTIVE
                                </>
                            ) : (
                                "Buffer_Sync_Complete"
                            )}
                        </span>
                    </div>
                </div>
                <div className="px-2">
                    <h3 className="text-xl font-tactical font-bold mb-1 tracking-tight uppercase italic text-white truncate">
                        {title}
                    </h3>
                </div>
            </Link>

            <div className="flex justify-between items-center px-2 mt-2">
                <Link
                    href={`/artist/${encodeURIComponent(artist)}`}
                    className="text-[10px] font-tactical opacity-30 hover:opacity-100 transition-opacity uppercase text-white z-20"
                >
                    Creator: @{artist}
                </Link>
                <button className="opacity-20 hover:opacity-100 transition-all text-white z-20">
                    <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}

