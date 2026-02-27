import React from "react";
import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VidstackPlayerProps {
    src: string;
    title: string;
    poster?: string;
    thumbnails?: string; // VTT file for seek preview
    type?: string;
}

/**
 * Vidstack player component for Next.js.
 * Uses Vidstack v1.12.9 API with default layout and thumbnails support.
 * @param props - Component properties
 * @returns React component using Vidstack
 */
export default function VidstackPlayer({
    src,
    title,
    poster,
    thumbnails,
    type,
}: VidstackPlayerProps) {
    return (
        <div className="rounded-2xl overflow-hidden border border-white/10 glass-panel aspect-video">
            <MediaPlayer
                title={title}
                src={{ src, type: (type || "video/mp4") as any }}
                poster={poster}
                viewType="video"
                streamType="on-demand"
                crossOrigin
                playsInline
            >
                <MediaProvider>
                    {poster && <Poster src={poster} alt={title} className="vds-poster" />}
                    {thumbnails && (
                        <Track
                            src={thumbnails}
                            kind={"thumbnails" as any}
                            label="Preview"
                            lang="en-US"
                            default
                        />
                    )}
                </MediaProvider>
                <DefaultVideoLayout
                    icons={defaultLayoutIcons}
                    thumbnails={thumbnails}
                />
            </MediaPlayer>
        </div>
    );
}

