"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    availableTags: { name: string }[];
    placeholder?: string;
    className?: string;
    label?: string;
}

/**
 * A tactical tag input with predictive suggestions.
 * @param props - Component properties
 * @returns React component
 */
export function TagInput({
    selectedTags,
    onTagsChange,
    availableTags,
    placeholder = "Add_Tag...",
    className,
    label,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestions = availableTags
        .filter((tag) => {
            const tagName = tag.name.toLowerCase();
            const search = inputValue.toLowerCase();
            return (
                tagName.includes(search) &&
                !selectedTags.map(t => t.toLowerCase()).includes(tagName)
            );
        })
        .slice(0, 8);

    useEffect(() => {
        setSelectedIndex(0);
    }, [inputValue]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addTag = (tag: string) => {
        const normalized = tag.trim().toLowerCase();
        if (normalized && !selectedTags.map(t => t.toLowerCase()).includes(normalized)) {
            onTagsChange([...selectedTags, normalized]);
        }
        setInputValue("");
        setSelectedIndex(0);
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(selectedTags.filter((t) => t !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions.length > 0 && isFocused && inputValue.trim() !== "") {
                addTag(suggestions[selectedIndex].name);
            } else if (inputValue.trim() !== "") {
                addTag(inputValue);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
        } else if (e.key === "Escape") {
            setIsFocused(false);
        } else if (e.key === "Backspace" && inputValue === "" && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }
    };

    return (
        <div className={cn("space-y-3", className)} ref={containerRef}>
            {label && (
                <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest block text-white">
                    {label} // {selectedTags.length}
                </label>
            )}

            <div className="relative">
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="px-3 py-1 text-[9px] font-tactical uppercase bg-white text-black border border-white flex items-center gap-2 hover:bg-white/80 transition-colors group"
                        >
                            <Hash className="w-2 h-2 opacity-40" />
                            {tag}
                            <X className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                        </button>
                    ))}
                </div>

                <div className="relative flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent border-b border-white/10 py-2 text-sm font-tactical focus:outline-none focus:border-white/30 transition-all placeholder:opacity-10 uppercase text-white"
                    />
                    <button
                        type="button"
                        onClick={() => inputValue.trim() && addTag(inputValue)}
                        className="px-4 py-1 border border-white/10 text-[10px] font-tactical uppercase hover:border-white/30 transition-colors text-white"
                    >
                        Add
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {isFocused && (inputValue.length > 0 || suggestions.length > 0) && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-black/90 backdrop-blur-xl border border-white/10 rounded overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
                        {suggestions.length > 0 ? (
                            <div className="py-1">
                                {suggestions.map((tag, index) => (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            addTag(tag.name);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-[10px] font-tactical uppercase transition-colors flex items-center gap-3",
                                            index === selectedIndex ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn("w-1 h-1 rounded-full", index === selectedIndex ? "bg-black" : "bg-white/20")} />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        ) : inputValue.length > 0 ? (
                            <div className="px-4 py-3 text-[8px] font-tactical uppercase opacity-30 italic text-white text-center">
                                No_System_Match // Press Enter to create
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
