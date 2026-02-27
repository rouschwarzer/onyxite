"use client";

import React, { useState } from "react";
import { X, Save, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
}: EditMetadataDrawerProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialData.title);
    const [description, setDescription] = useState(initialData.description || "");
    const [artistName, setArtistName] = useState(initialData.artistName || "");
    const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags);
    const [newTag, setNewTag] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const toggleTag = (tagName: string) => {
        const normalizedTag = tagName.toLowerCase();
        setSelectedTags((prev) =>
            prev.includes(normalizedTag)
                ? prev.filter((t) => t !== normalizedTag)
                : [...prev, normalizedTag]
        );
    };

    const handleAddTag = () => {
        const tag = newTag.trim().toLowerCase();
        if (tag && !selectedTags.includes(tag)) {
            setSelectedTags((prev) => [...prev, tag]);
        }
        setNewTag("");
    };

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

                <div className="space-y-2">
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

                <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical mb-3 text-white">
                        Index_Tags // Linked: {selectedTags.length}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className="px-3 py-1 text-[9px] font-tactical uppercase bg-white text-black border border-white flex items-center gap-2 group"
                            >
                                {tag}
                                <X className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[8px] uppercase tracking-widest opacity-20 font-tactical text-white">
                            Available_Suggestions
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-hide py-1">
                            {availableTags
                                .filter((tag) => !selectedTags.includes(tag.name.toLowerCase()))
                                .map((tag) => (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onClick={() => toggleTag(tag.name)}
                                        className="px-3 py-1 text-[9px] font-tactical uppercase border border-white/10 opacity-40 hover:border-white/30 hover:opacity-100 transition-all text-white"
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                        </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                            placeholder="+ Add_New_Identifier"
                            className="flex-1 bg-transparent border-b border-white/10 py-1 text-[10px] font-tactical focus:outline-none focus:border-white uppercase opacity-40 focus:opacity-100 text-white"
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            className="text-white opacity-40 hover:opacity-100 transition-opacity"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
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
