"use client";

import React from "react";

interface VideoPlayerProps {
    src: string;
    title: string;
    poster?: string;
    type?: string;
}

export function VideoPlayer({ src, title, poster, type }: VideoPlayerProps) {
    return (
        <div className="rounded-2xl overflow-hidden border border-white/10 glass-panel aspect-video bg-black/20 relative group">
            <video
                src={src}
                poster={poster}
                controls
                playsInline
                className="w-full h-full object-contain"
                title={title}
            >
                <source src={src} type={type || "video/mp4"} />
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
