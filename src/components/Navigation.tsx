"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Search,
    Home,
    LayoutDashboard,
    PlusSquare,
    Bookmark,
    User,
    X,
    Upload,
    FileVideo,
    Image as ImageIcon,
    Loader2,
    Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TagInput } from "./TagInput";

interface NavigationProps {
    userRole?: string;
}

/** Accepted MIME types for upload */
const ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Navigation component with search and upload functionality.
 * @param props - Component properties
 * @returns React component for navigation
 */
export function Navigation({ userRole }: NavigationProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [searchOpen, setSearchOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Filter Engine State
    const [query, setQuery] = useState("");
    const [artist, setArtist] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<
        { id: string; name: string }[]
    >([]);
    const [availableArtists, setAvailableArtists] = useState<
        { id: string; name: string }[]
    >([]);
    const [mediaType, setMediaType] = useState<"video" | "image" | "all">("all");

    // Upload State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadName, setUploadName] = useState("");
    const [uploadDescription, setUploadDescription] = useState("");
    const [uploadCategory, setUploadCategory] = useState<
        "auto" | "image" | "video" | "series"
    >("auto");
    const [uploadArtist, setUploadArtist] = useState("");

    const [uploadVisibility, setUploadVisibility] = useState<
        "private" | "public"
    >("public");
    const [uploadTags, setUploadTags] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Series Upload State
    const [seriesFiles, setSeriesFiles] = useState<File[]>([]);
    const [seriesPreviews, setSeriesPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{
        current: number;
        total: number;
        status: string;
    }>({ current: 0, total: 0, status: "" });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const seriesInputRef = useRef<HTMLInputElement>(null);

    /** Whether we're in series upload mode */
    const isSeriesMode = uploadCategory === "series";

    useEffect(() => {
        // Fetch Tags
        fetch("/api/tags")
            .then((res) => res.json())
            .then((data) => setAvailableTags(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Failed to load tags", err));

        // Fetch Artists
        fetch("/api/artists")
            .then((res) => res.json())
            .then((data) => setAvailableArtists(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Failed to load artists", err));

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (artist) params.set("artist", artist.replace("@", ""));
        if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
        if (mediaType !== "all") params.set("type", mediaType);

        router.push(`/search?${params.toString()}`);
        setSearchOpen(false);
    };

    const isActive = (path: string) => pathname === path;

    /** Resets all upload form state to defaults */
    const resetUploadForm = useCallback(() => {
        setUploadFile(null);
        setUploadPreview(null);
        setUploadName("");
        setUploadDescription("");
        setUploadCategory("auto");
        setUploadArtist("");
        setUploadVisibility("public");
        setUploadTags([]);
        setUploadError("");
        setUploadSuccess(false);
        setSeriesFiles([]);
        setSeriesPreviews([]);
        setUploadProgress({ current: 0, total: 0, status: "" });
    }, []);

    /** Handles single file selection (non-series mode) */
    const handleFileSelect = useCallback(
        (file: File) => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                setUploadError(
                    "Invalid file type. Accepted: JPEG, PNG, GIF, WEBP, MP4, WEBM, MOV"
                );
                return;
            }

            if (file.size > 100 * 1024 * 1024) {
                setUploadError("File size exceeds 100MB limit");
                return;
            }

            setUploadError("");
            setUploadFile(file);

            if (!uploadName) {
                const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
                setUploadName(nameWithoutExt);
            }

            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => setUploadPreview(e.target?.result as string);
                reader.readAsDataURL(file);
            } else if (file.type.startsWith("video/")) {
                const url = URL.createObjectURL(file);
                setUploadPreview(url);
            }
        },
        [uploadName]
    );

    /** Handles multiple file selection for series mode */
    const handleSeriesFilesSelect = useCallback(
        (newFiles: File[]) => {
            const validFiles: File[] = [];
            for (const file of newFiles) {
                if (!IMAGE_TYPES.includes(file.type)) {
                    setUploadError("Series only accepts images: JPEG, PNG, GIF, WEBP");
                    return;
                }
                if (file.size > 100 * 1024 * 1024) {
                    setUploadError(`File "${file.name}" exceeds 100MB limit`);
                    return;
                }
                validFiles.push(file);
            }

            setUploadError("");
            const combined = [...seriesFiles, ...validFiles];
            setSeriesFiles(combined);

            if (!uploadName && validFiles.length > 0) {
                const nameWithoutExt = validFiles[0].name.replace(/\.[^.]+$/, "");
                setUploadName(nameWithoutExt);
            }

            /** Generate previews for new files */
            const newPreviews: Promise<string>[] = validFiles.map(
                (file) =>
                    new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(file);
                    })
            );

            Promise.all(newPreviews).then((previews) => {
                setSeriesPreviews((prev) => [...prev, ...previews]);
            });
        },
        [seriesFiles, uploadName]
    );

    /** Handles drag-and-drop events on the upload zone */
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);

            if (isSeriesMode) {
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) handleSeriesFilesSelect(files);
            } else {
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
            }
        },
        [isSeriesMode, handleFileSelect, handleSeriesFilesSelect]
    );

    /** Removes a file from the series queue */
    const removeSeriesFile = useCallback((index: number) => {
        setSeriesFiles((prev) => prev.filter((_, i) => i !== index));
        setSeriesPreviews((prev) => prev.filter((_, i) => i !== index));
    }, []);

    /** Moves a series file up or down in the queue */
    const moveSeriesFile = useCallback((index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        setSeriesFiles((prev) => {
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const arr = [...prev];
            [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];
            return arr;
        });
        setSeriesPreviews((prev) => {
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const arr = [...prev];
            [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];
            return arr;
        });
    }, []);



    const uploadSingleFile = async (
        file: File,
        opts: {
            name: string;
            description: string;
            category: string;
            artistName: string;
            visibility: string;
            tags: string;
            parentFileId?: string;
            sequence?: number;
        }
    ): Promise<{ success: boolean; fileId?: string; error?: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", opts.name);
        formData.append("description", opts.description);
        formData.append("category", opts.category);
        formData.append("artistName", opts.artistName);
        formData.append("visibility", opts.visibility);
        formData.append("tags", opts.tags);
        if (opts.parentFileId) formData.append("parentFileId", opts.parentFileId);
        if (opts.sequence !== undefined)
            formData.append("sequence", String(opts.sequence));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) return { success: false, error: data.error || "Upload failed" };
        return { success: true, fileId: data.fileId };
    };

    /** Submits the upload form to the API */
    const handleUploadSubmit = useCallback(async () => {
        if (!uploadName.trim()) {
            setUploadError("Name is required");
            return;
        }

        setUploading(true);
        setUploadError("");

        try {
            if (isSeriesMode) {
                if (seriesFiles.length < 2) {
                    setUploadError("Series requires at least 2 files (cover + 1 page)");
                    setUploading(false);
                    return;
                }

                const totalFiles = seriesFiles.length;

                /** Step 1: Upload cover (first file) as parent */
                setUploadProgress({
                    current: 1,
                    total: totalFiles,
                    status: "Uploading cover...",
                });
                const coverResult = await uploadSingleFile(seriesFiles[0], {
                    name: uploadName.trim(),
                    description: uploadDescription.trim(),
                    category: "series",
                    artistName: uploadArtist.trim(),
                    visibility: uploadVisibility,
                    tags: uploadTags.join(","),
                });

                if (!coverResult.success || !coverResult.fileId) {
                    setUploadError(coverResult.error || "Cover upload failed");
                    setUploading(false);
                    return;
                }

                const parentId = coverResult.fileId;

                /** Step 2: Upload each page sequentially */
                for (let i = 1; i < seriesFiles.length; i++) {
                    setUploadProgress({
                        current: i + 1,
                        total: totalFiles,
                        status: `Uploading page ${i}/${seriesFiles.length - 1}...`,
                    });

                    const pageResult = await uploadSingleFile(seriesFiles[i], {
                        name: `${uploadName.trim()} - Page ${i}`,
                        description: "",
                        category: "image",
                        artistName: uploadArtist.trim(),
                        visibility: uploadVisibility,
                        tags: "",
                        parentFileId: parentId,
                        sequence: i,
                    });

                    if (!pageResult.success) {
                        setUploadError(`Page ${i} failed: ${pageResult.error}`);
                        setUploading(false);
                        return;
                    }
                }
            } else {
                /** Single file upload */
                if (!uploadFile) {
                    setUploadError("SELECT_TARGET_ASSET");
                    setUploading(false);
                    return;
                }

                setUploadProgress({ current: 0, total: 100, status: "INITIALIZING_BRIDGE..." });

                const result = await uploadSingleFile(uploadFile, {
                    name: uploadName.trim(),
                    description: uploadDescription.trim(),
                    category: uploadCategory,
                    artistName: uploadArtist.trim(),
                    visibility: uploadVisibility,
                    tags: uploadTags.join(","),
                });

                if (!result.success) {
                    setUploadError(result.error || "SYNC_REJECTED");
                    setUploading(false);
                    return;
                }

                setUploadProgress({ current: 100, total: 100, status: "PROTOCOL_VERIFIED." });
            }

            setUploadSuccess(true);
            setTimeout(() => {
                setUploadOpen(false);
                resetUploadForm();
                router.refresh();
                // If it was a single file, maybe redirect to it?
                // But for now refresh current page is safer.
            }, 2000);
        } catch (err: any) {
            setUploadError(err.message || "Network error");
        } finally {
            setUploading(false);
        }
    }, [
        uploadFile,
        uploadName,
        uploadDescription,
        uploadCategory,
        uploadArtist,
        uploadVisibility,
        uploadTags,
        isSeriesMode,
        seriesFiles,
        resetUploadForm,
        router,
    ]);

    /** Formats file size bytes to human-readable string */
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    /** Whether the submit button should be enabled */
    const canSubmit = isSeriesMode ? seriesFiles.length >= 2 : !!uploadFile;

    return (
        <>
            {/* Top Navbar */}
            <nav className="fixed top-0 left-0 w-full z-50 pointer-events-none">
                <div className="w-full max-w-[1400px] mx-auto p-4 flex items-start justify-between">
                    <Link
                        href="/"
                        className={cn(
                            "pointer-events-auto flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg transition-all hover:border-white/30 hover:bg-black/60",
                            scrolled
                                ? "translate-y-[-5px] scale-[0.98] opacity-90"
                                : "translate-y-0 scale-100 opacity-100"
                        )}
                    >
                        <div className="flex flex-col">
                            <span className="font-tactical font-bold text-lg tracking-tighter leading-none">
                                ONYXITE
                            </span>
                            <span className="text-[8px] font-tactical uppercase tracking-widest opacity-40">
                                System_v2.6.4
                            </span>
                        </div>
                        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-[8px] font-tactical opacity-60 uppercase">
                                Encrypted
                            </span>
                        </div>
                    </Link>
                    <div className="pointer-events-auto flex items-center gap-2">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="h-11 w-11 flex items-center justify-center bg-white text-black rounded-lg hover:scale-95 transition-transform"
                        >
                            <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Search Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] bg-background border border-white/10 flex flex-col p-6 transition-all duration-500 ease-out",
                    searchOpen
                        ? "translate-y-0 opacity-100 visible"
                        : "translate-y-10 opacity-0 invisible"
                )}
            >
                <div className="flex justify-between items-start mb-12 relative z-10">
                    <span className="font-tactical text-xs tracking-[0.3em] uppercase opacity-70">
                        Filter_Engine
                    </span>
                    <button
                        onClick={() => setSearchOpen(false)}
                        className="text-4xl font-light hover:opacity-50 transition-opacity"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>
                <div className="max-w-4xl mx-auto w-full space-y-12 relative z-10">
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase opacity-60 font-tactical tracking-widest">
                            Master Query
                        </label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="CMD_EXPLORE..."
                            className="w-full bg-transparent border-b-2 border-white/40 py-4 text-2xl sm:text-3xl md:text-5xl font-tactical focus:outline-none focus:border-white transition-all placeholder:opacity-30 uppercase text-white"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase opacity-60 font-tactical tracking-widest">
                                Artist_ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="@"
                                    className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-white font-tactical text-white"
                                />
                                {artist && !availableArtists.some(a => a.name.toLowerCase() === artist.toLowerCase()) && (
                                    <div className="absolute z-10 w-full mt-1 bg-black border border-white/10 p-2 max-h-32 overflow-y-auto scrollbar-hide">
                                        {availableArtists
                                            .filter(a => a.name.toLowerCase().includes(artist.toLowerCase().replace("@", "")))
                                            .map(a => (
                                                <button
                                                    key={a.id}
                                                    onClick={() => {
                                                        setArtist(a.name);
                                                    }}
                                                    className="w-full text-left px-2 py-1 text-[9px] uppercase font-tactical hover:bg-white hover:text-black transition-colors text-white"
                                                >
                                                    {a.name}
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <TagInput
                                label="Tags"
                                selectedTags={selectedTags}
                                onTagsChange={setSelectedTags}
                                availableTags={availableTags}
                                placeholder="Search_Tags..."
                                className="mt-4"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase opacity-60 font-tactical tracking-widest">
                                Media_Type
                            </label>
                            <div className="flex gap-2">
                                {(["video", "image", "all"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setMediaType(type)}
                                        className={cn(
                                            "px-4 py-1 border text-[10px] font-tactical uppercase transition-colors",
                                            mediaType === type
                                                ? "border-white bg-white text-black"
                                                : "border-white/10 opacity-50 text-white"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="w-full py-6 border border-white font-tactical uppercase tracking-[0.5em] text-sm hover:bg-white text-black bg-white transition-all"
                    >
                        Submit_Query
                    </button>
                </div>
            </div>

            {/* Upload Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] glass-panel flex flex-col transition-all duration-500 ease-out overflow-y-auto",
                    uploadOpen
                        ? "translate-y-0 opacity-100 visible"
                        : "translate-y-10 opacity-0 invisible"
                )}
            >
                <div className="p-6 flex justify-between items-start sticky top-0 z-20 bg-bg-deep/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Upload className="w-4 h-4 opacity-40 text-white" />
                        <span className="font-tactical text-xs tracking-[0.3em] uppercase opacity-50 text-white">
                            {isSeriesMode ? "Series_Upload_Module" : "Upload_Module"}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setUploadOpen(false);
                            resetUploadForm();
                        }}
                        className="text-4xl font-light hover:opacity-50 transition-opacity text-white"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                <div className="max-w-3xl mx-auto w-full p-6 space-y-8 pb-32">
                    {uploadSuccess && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-16 h-16 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <p className="font-tactical text-sm uppercase tracking-[0.3em] opacity-60 text-white">
                                Upload_Complete
                            </p>
                            <p className="font-tactical text-[9px] uppercase tracking-widest opacity-30 text-white">
                                Redirecting...
                            </p>
                        </div>
                    )}

                    {!uploadSuccess && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest text-white">
                                    Upload_Mode
                                </label>
                                <div className="flex gap-2 flex-wrap text-white">
                                    {(["auto", "image", "video", "series"] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setUploadCategory(cat);
                                                if (cat === "series") {
                                                    setUploadFile(null);
                                                    setUploadPreview(null);
                                                } else {
                                                    setSeriesFiles([]);
                                                    setSeriesPreviews([]);
                                                }
                                                setUploadError("");
                                            }}
                                            className={cn(
                                                "px-4 py-1.5 border text-[10px] font-tactical uppercase transition-colors",
                                                uploadCategory === cat
                                                    ? "border-white bg-white text-black"
                                                    : "border-white/10 opacity-50 hover:opacity-100 text-white"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!isSeriesMode ? (
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group",
                                        dragOver
                                            ? "border-white bg-white/5"
                                            : uploadFile
                                                ? "border-white/20 bg-white/2"
                                                : "border-white/10 hover:border-white/30 hover:bg-white/2",
                                        !uploadFile && "min-h-[220px]"
                                    )}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPTED_TYPES.join(",")}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                    />

                                    {!uploadFile && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                            <div className="w-12 h-12 border border-white/10 rounded-lg flex items-center justify-center group-hover:border-white/30 transition-colors">
                                                <Upload className="w-5 h-5 opacity-30 group-hover:opacity-60 transition-opacity text-white" />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="font-tactical text-xs uppercase tracking-[0.2em] opacity-40 text-white">
                                                    Drop_File_Here
                                                </p>
                                                <p className="font-tactical text-[8px] uppercase tracking-widest opacity-20 text-white">
                                                    Or click to browse // Max 100MB
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {uploadFile && uploadPreview && (
                                        <div className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/50">
                                                    {uploadFile.type.startsWith("image/") ? (
                                                        <img
                                                            src={uploadPreview || ""}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={uploadPreview || ""}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-2 py-1 text-white">
                                                    <p className="font-tactical text-xs font-bold tracking-tight truncate">
                                                        {uploadFile.name}
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <span className="text-[8px] font-tactical uppercase tracking-widest opacity-30">
                                                            {formatSize(uploadFile.size)}
                                                        </span>
                                                        <span className="text-[8px] font-tactical uppercase tracking-widest opacity-30">
                                                            {uploadFile.type}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUploadFile(null);
                                                            setUploadPreview(null);
                                                            if (fileInputRef.current)
                                                                fileInputRef.current.value = "";
                                                        }}
                                                        className="text-[9px] font-tactical uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity mt-2"
                                                    >
                                                        Remove_File
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(true);
                                        }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => seriesInputRef.current?.click()}
                                        className={cn(
                                            "border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group min-h-[140px]",
                                            dragOver
                                                ? "border-white bg-white/5"
                                                : "border-white/10 hover:border-white/30 hover:bg-white/2"
                                        )}
                                    >
                                        <input
                                            ref={seriesInputRef}
                                            type="file"
                                            accept={IMAGE_TYPES.join(",")}
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 0) handleSeriesFilesSelect(files);
                                                if (seriesInputRef.current)
                                                    seriesInputRef.current.value = "";
                                            }}
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                                            <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center group-hover:border-white/30 transition-colors">
                                                <Upload className="w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity text-white" />
                                            </div>
                                            <p className="font-tactical text-[10px] uppercase tracking-[0.2em] opacity-40 text-white">
                                                {seriesFiles.length > 0
                                                    ? "Add_More_Pages"
                                                    : "Drop_Series_Images"}
                                            </p>
                                        </div>
                                    </div>

                                    {seriesFiles.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-white">
                                                <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest">
                                                    Page_Queue // {seriesFiles.length} Files
                                                </label>
                                                <span className="text-[8px] font-tactical uppercase tracking-widest opacity-20">
                                                    Total:{" "}
                                                    {formatSize(seriesFiles.reduce((sum, f) => sum + f.size, 0))}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                                                {seriesFiles.map((file, i) => (
                                                    <div
                                                        key={`${file.name}-${i}`}
                                                        className={cn(
                                                            "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                                                            i === 0
                                                                ? "border-white/20 bg-white/5"
                                                                : "border-white/5 hover:border-white/15"
                                                        )}
                                                    >
                                                        <div className="w-10 h-10 rounded overflow-hidden border border-white/10 shrink-0 bg-black/50 text-white">
                                                            {seriesPreviews[i] && (
                                                                <img
                                                                    src={seriesPreviews[i]}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 text-white">
                                                            <span
                                                                className={cn(
                                                                    "text-[8px] font-tactical uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                                    i === 0
                                                                        ? "bg-white text-black font-bold"
                                                                        : "bg-white/10 opacity-40"
                                                                )}
                                                            >
                                                                {i === 0
                                                                    ? "COVER"
                                                                    : `PG_${String(i).padStart(2, "0")}`}
                                                            </span>
                                                            <p className="text-[9px] font-tactical opacity-30 truncate mt-0.5">
                                                                {file.name}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => moveSeriesFile(i, "up")}
                                                                disabled={i === 0}
                                                                className="text-[8px] opacity-20 hover:opacity-100 text-white disabled:opacity-0"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                onClick={() => moveSeriesFile(i, "down")}
                                                                disabled={i === seriesFiles.length - 1}
                                                                className="text-[8px] opacity-20 hover:opacity-100 text-white disabled:opacity-0"
                                                            >
                                                                ▼
                                                            </button>
                                                            <button
                                                                onClick={() => removeSeriesFile(i)}
                                                                className="opacity-20 hover:opacity-100 text-white"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest text-white">
                                        {isSeriesMode ? "Series_Name *" : "Asset_Name *"}
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadName}
                                        onChange={(e) => setUploadName(e.target.value)}
                                        placeholder={
                                            isSeriesMode
                                                ? "Enter_Series_Title..."
                                                : "Enter_Asset_Name..."
                                        }
                                        className="w-full bg-transparent border-b-2 border-white/20 py-3 text-xl font-tactical focus:outline-none focus:border-white transition-all placeholder:opacity-10 uppercase text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest text-white">
                                        Description
                                    </label>
                                    <textarea
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        placeholder="Optional_Description..."
                                        rows={3}
                                        className="w-full bg-transparent border border-white/10 rounded-lg p-3 text-sm font-tactical focus:outline-none focus:border-white/30 transition-all placeholder:opacity-10 resize-none text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest text-white">
                                            Visibility
                                        </label>
                                        <div className="flex gap-2">
                                            {(["public", "private"] as const).map((vis) => (
                                                <button
                                                    key={vis}
                                                    onClick={() => setUploadVisibility(vis)}
                                                    className={cn(
                                                        "px-4 py-1.5 border text-[10px] font-tactical uppercase transition-colors",
                                                        uploadVisibility === vis
                                                            ? "border-white bg-white text-black"
                                                            : "border-white/10 opacity-50 hover:opacity-100 text-white"
                                                    )}
                                                >
                                                    {vis}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase opacity-40 font-tactical tracking-widest text-white">
                                        Artist_Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={uploadArtist}
                                            onChange={(e) => setUploadArtist(e.target.value)}
                                            placeholder="@original_source..."
                                            className="w-full bg-transparent border-b border-white/10 py-2 font-tactical focus:outline-none focus:border-white transition-all placeholder:opacity-10 text-white"
                                        />
                                        {uploadArtist && !availableArtists.some(a => a.name.toLowerCase() === uploadArtist.toLowerCase()) && (
                                            <div className="absolute z-[70] w-full mt-1 bg-black border border-white/10 p-2 max-h-32 overflow-y-auto scrollbar-hide shadow-xl">
                                                {availableArtists
                                                    .filter(a => a.name.toLowerCase().includes(uploadArtist.toLowerCase().replace("@", "")))
                                                    .map(a => (
                                                        <button
                                                            key={a.id}
                                                            onClick={() => {
                                                                setUploadArtist(a.name);
                                                            }}
                                                            className="w-full text-left px-2 py-1 text-[9px] uppercase font-tactical hover:bg-white hover:text-black transition-colors text-white"
                                                        >
                                                            {a.name}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <TagInput
                                        label="Asset_Tags"
                                        selectedTags={uploadTags}
                                        onTagsChange={setUploadTags}
                                        availableTags={availableTags}
                                        placeholder="Add_Tag..."
                                    />
                                </div>
                            </div>

                            {uploadError && (
                                <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3">
                                    <p className="font-tactical text-[10px] uppercase tracking-widest text-red-400">
                                        Error: {uploadError}
                                    </p>
                                </div>
                            )}

                            {uploading && isSeriesMode && uploadProgress.total > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-white">
                                        <span className="text-[10px] font-tactical uppercase tracking-widest opacity-40">
                                            {uploadProgress.status}
                                        </span>
                                        <span className="text-[10px] font-tactical uppercase tracking-widest opacity-40">
                                            {uploadProgress.current}/{uploadProgress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-white h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(uploadProgress.current / uploadProgress.total) * 100
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleUploadSubmit}
                                disabled={uploading || !canSubmit}
                                className={cn(
                                    "w-full py-5 border font-tactical uppercase tracking-[0.5em] text-sm transition-all flex items-center justify-center gap-3",
                                    uploading
                                        ? "border-white/20 opacity-50 cursor-wait text-white"
                                        : canSubmit
                                            ? "border-white hover:bg-white hover:text-black cursor-pointer text-white"
                                            : "border-white/10 opacity-20 cursor-not-allowed text-white"
                                )}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isSeriesMode
                                            ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                                            : "Uploading..."}
                                    </>
                                ) : isSeriesMode ? (
                                    "Submit_Series"
                                ) : (
                                    "Submit_Upload"
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Utility Strip */}
            <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
                <div className="w-full max-w-[360px] pointer-events-auto">
                    <div className="flex items-stretch glass-panel overflow-hidden border border-white/20 shadow-2xl h-16 rounded-xl">
                        <Link
                            href="/"
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 nav-segment transition-colors",
                                isActive("/") ? "active bg-white/5" : "hover:bg-white/5"
                            )}
                        >
                            <Home
                                className={cn(
                                    "w-[18px] h-[18px]",
                                    isActive("/") ? "opacity-100" : "opacity-40"
                                )}
                                strokeWidth={2}
                            />
                            <span
                                className={cn(
                                    "text-[8px] font-tactical uppercase tracking-widest",
                                    isActive("/") ? "opacity-100" : "opacity-40"
                                )}
                            >
                                Home
                            </span>
                        </Link>

                        <button
                            onClick={() => setSearchOpen(true)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 nav-segment border-l border-white/10 transition-colors",
                                searchOpen ? "active bg-white/5" : "hover:bg-white/5"
                            )}
                        >
                            <Search
                                className={cn(
                                    "w-[18px] h-[18px]",
                                    searchOpen ? "opacity-100" : "opacity-40"
                                )}
                                strokeWidth={2}
                            />
                            <span
                                className={cn(
                                    "text-[8px] font-tactical uppercase tracking-widest",
                                    searchOpen ? "opacity-100" : "opacity-40"
                                )}
                            >
                                Search
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                resetUploadForm();
                                setUploadOpen(true);
                            }}
                            className="w-14 flex items-center justify-center bg-white text-black hover:bg-gray-200 transition-colors"
                        >
                            <PlusSquare className="w-6 h-6" strokeWidth={2.5} />
                        </button>

                        {userRole === "admin" && (
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center gap-1 nav-segment border-l border-white/10 transition-colors",
                                    isActive("/dashboard") ? "active bg-white/5" : "hover:bg-white/5"
                                )}
                            >
                                <LayoutDashboard
                                    className={cn(
                                        "w-[18px] h-[18px]",
                                        isActive("/dashboard") ? "opacity-100" : "opacity-40"
                                    )}
                                    strokeWidth={2}
                                />
                                <span
                                    className={cn(
                                        "text-[8px] font-tactical uppercase tracking-widest",
                                        isActive("/dashboard") ? "opacity-100" : "opacity-40"
                                    )}
                                >
                                    Admin
                                </span>
                            </Link>
                        )}

                        <Link
                            href="/saved"
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 nav-segment border-l border-white/10 transition-colors",
                                isActive("/saved") ? "active bg-white/5" : "hover:bg-white/5"
                            )}
                        >
                            <Bookmark
                                className={cn(
                                    "w-[18px] h-[18px]",
                                    isActive("/saved") ? "opacity-100" : "opacity-40"
                                )}
                                strokeWidth={2}
                            />
                            <span
                                className={cn(
                                    "text-[8px] font-tactical uppercase tracking-widest",
                                    isActive("/saved") ? "opacity-100" : "opacity-40"
                                )}
                            >
                                Save
                            </span>
                        </Link>
                        <Link
                            href="/user"
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 nav-segment border-l border-white/10 transition-colors",
                                isActive("/user") ? "active bg-white/5" : "hover:bg-white/5"
                            )}
                        >
                            <User
                                className={cn(
                                    "w-[18px] h-[18px]",
                                    isActive("/user") ? "opacity-100" : "opacity-40"
                                )}
                                strokeWidth={2}
                            />
                            <span
                                className={cn(
                                    "text-[8px] font-tactical uppercase tracking-widest",
                                    isActive("/user") ? "opacity-100" : "opacity-40"
                                )}
                            >
                                User
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
