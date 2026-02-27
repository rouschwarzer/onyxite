"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ImageCardProps {
    id: string;
    title: string;
    artist: string;
    res: string;
    delay?: number;
    isSerial?: boolean;
    thumbnailUrl?: string;
}

/**
 * ImageCard component for displaying image previews.
 * @param props - Component properties
 * @returns React component for image card
 */
export function ImageCard({
    id,
    title,
    artist,
    res,
    delay = 0,
    isSerial = false,
    thumbnailUrl,
}: ImageCardProps) {
    // Route dynamically
    const link = isSerial ? `/gallery/${id}` : `/image/${id}`;

    return (
        <Link
            href={link}
            className="flex flex-col group tactical-card p-3 rounded-[20px] animate-in fade-in fill-mode-both"
            style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
        >
            <div className="aspect-[4/5] bg-[#0a0a0a] rounded-lg mb-4 relative overflow-hidden group-hover:scale-[0.97] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 z-10"></div>

                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity z-0 relative"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900/50 font-tactical text-[7px] opacity-20 italic z-0 relative">
                        IMG_00{id}_VRT
                    </div>
                )}

                <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-20">
                    <span className="text-[7px] font-tactical uppercase tracking-widest opacity-80 shadow-sm text-white">
                        Meta: 4:5_{res}
                    </span>
                    <div className="w-8 h-[1px] bg-white/40"></div>
                </div>
            </div>
            <div className="px-1 flex flex-col gap-1 text-white">
                <h4 className="text-[11px] font-tactical font-bold uppercase tracking-tight truncate">
                    {title}
                </h4>
                <div className="flex justify-between items-center">
                    <span className="text-[8px] font-tactical opacity-30">@{artist}</span>
                    <div className="flex gap-2">
                        <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                        <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
