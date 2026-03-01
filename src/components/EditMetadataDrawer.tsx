"use client";

import React, { useState } from "react";
import { X, Save, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TagInput } from "./TagInput";

interface EditMetadataDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    contentId: string;
    initialData: {
        title: string;
        description: string;
        artistName: string;
        tags: string[];
    };
    availableTags: { name: string }[];
    availableArtists: { name: string }[];
}

/**
 * Drawer component for editing asset metadata.
 * @param props - Component properties
 * @returns React component
 */
export function EditMetadataDrawer({
    isOpen,
    onClose,
    contentId,
    initialData,
    availableTags,
    availableArtists,
}: EditMetadataDrawerProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialData.title);
    const [description, setDescription] = useState(initialData.description || "");
    const [artistName, setArtistName] = useState(initialData.artistName || "");
    const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch("/api/assets/update-meta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentId,
                    name: title,
                    description,
                    artistName,
                    selectedTags,
                }),
            });

            if (res.ok) {
                onClose();
                router.refresh();
            } else {
                const error = await res.text();
                alert(`Failed to save: ${error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Network error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className={cn(
                "fixed inset-y-0 right-0 w-full max-w-md bg-black/95 backdrop-blur-2xl border-l border-white/10 z-[100] transform transition-transform duration-500 ease-out p-8 shadow-2xl overflow-y-auto",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            <div className="flex justify-between items-center mb-12">
                <h3 className="text-xl font-tactical font-bold tracking-tighter uppercase italic text-white text-white">
                    Patch_Metadata
                </h3>
                <button
                    onClick={onClose}
                    className="opacity-40 hover:opacity-100 transition-opacity text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical text-white">
                        Asset_Display_Name
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm font-tactical focus:border-white focus:outline-none transition-colors text-white"
                        placeholder="Untitled_Asset"
                        required
                    />
                </div>

                <div className="space-y-2 relative">
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical text-white">
                        Creator_Artist_Identifier
                    </label>
                    <input
                        type="text"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm font-tactical focus:border-white focus:outline-none transition-colors text-blue-400"
                        placeholder="Real_Artist_Name"
                    />

                    {/* Artist Suggestions */}
                    {artistName.trim().length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {availableArtists
                                .filter(a =>
                                    a.name.toLowerCase().includes(artistName.toLowerCase()) &&
                                    a.name !== artistName
                                )
                                .slice(0, 5)
                                .map((artist) => (
                                    <button
                                        key={artist.name}
                                        type="button"
                                        onClick={() => setArtistName(artist.name)}
                                        className="px-2 py-1 text-[8px] font-tactical uppercase bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all text-white opacity-60 hover:opacity-100"
                                    >
                                        {artist.name}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical text-white">
                        Asset_Entry_Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm font-tactical focus:border-white focus:outline-none transition-colors resize-none text-white"
                        placeholder="Enter asset description details..."
                    />
                </div>

                <div className="space-y-4">
                    <TagInput
                        label="Index_Tags"
                        selectedTags={selectedTags}
                        onTagsChange={setSelectedTags}
                        availableTags={availableTags}
                        placeholder="+ Add_New_Identifier"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-white text-black font-tactical font-bold text-xs uppercase tracking-[0.3em] hover:bg-gray-200 transition-colors mt-8 rounded shadow-lg flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        "Processing..."
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Synchronize_Commit
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
