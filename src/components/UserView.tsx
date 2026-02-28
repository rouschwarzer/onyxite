"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ImageCard } from "@/components/ImageCard";
import { VideoCard } from "@/components/VideoCard";
import { X, Upload, Shield, LogOut, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
interface UserViewProps {
    user: {
        id: string;
        username: string;
        role: string;
        avatarUrl: string | null;
        joinedDate: string;
    };
    uploads: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

/**
 * Client-side view for the user profile page.
 * @param props - Component properties
 * @returns React component with profile editing drawer
 */
export function UserView({ user, uploads, pagination }: UserViewProps) {
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [username, setUsername] = useState(user.username);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || "");
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [hasConfirmedSave, setHasConfirmedSave] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    /**
     * Generates a 64-character high-security access key.
     */
    const generateSecureKey = () => {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        const array = new Uint32Array(64);
        window.crypto.getRandomValues(array);
        let password = "";
        for (let i = 0; i < 64; i++) {
            password += charset[array[i] % charset.length];
        }
        setGeneratedPassword(password);
        setHasConfirmedSave(false);
        setIsCopied(false);
    };

    /**
     * Copies the generated key to clipboard.
     */
    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPassword);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const formData = new FormData(e.currentTarget as HTMLFormElement);

        try {
            const res = await fetch("/api/account/update", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const result = await res.json();
                if (result.requiresLogout) {
                    await fetch("/api/logout", { method: "POST" });
                    window.location.href = "/login";
                } else {
                    setIsDrawerOpen(false);
                    router.refresh();
                }
            } else {
                const msg = await res.text();
                setError(msg || "Update_Failed");
            }
        } catch (err) {
            setError("Network_Sync_Error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        if (confirm("Confirm system session termination?")) {
            const res = await fetch("/api/logout", { method: "POST" });
            if (res.ok) {
                window.location.href = "/login";
            }
        }
    };

    return (
        <>
            <Navigation userRole={user.role} />

            <main className="max-w-5xl mx-auto mt-32 px-4 relative z-0 pb-32">
                {/* User Header */}
                <header className="mb-16 glass-panel p-8 rounded-[20px] border border-white/20 relative overflow-hidden">

                    <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-center relative z-10 text-center sm:text-left">
                        <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-8 h-8 opacity-20 text-white" />
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-tactical uppercase tracking-widest text-white">
                                    Active
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-2">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                                    @{user.username}
                                </h1>
                                <span className="px-2 py-0.5 border border-emerald-500/50 text-emerald-400 text-[8px] font-tactical uppercase tracking-widest rounded flex items-center gap-1">
                                    <Shield className="w-2 h-2" />
                                    {user.role}
                                </span>
                            </div>
                            <p className="font-tactical text-[10px] uppercase tracking-[0.2em] opacity-40 mb-4 text-white">
                                System_Access // Active since: {user.joinedDate}
                            </p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                                <button
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 text-[9px] font-tactical uppercase tracking-widest hover:bg-white/10 transition-colors rounded text-white min-w-[120px]"
                                >
                                    Edit_Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-tactical uppercase tracking-widest hover:bg-red-500/20 transition-colors rounded flex items-center gap-2 min-w-[120px] justify-center"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Terminate_Session
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Uploads Grid */}
                <section>
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-l-2 border-white/20 pl-6 gap-4">
                        <div>
                            <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                                Personal Archive
                            </p>
                            <h2 className="text-xl sm:text-2xl font-tactical font-bold tracking-tighter uppercase italic text-white">
                                My_Uploads
                            </h2>
                        </div>
                        <div className="text-left sm:text-right opacity-20 font-tactical text-[8px] uppercase tracking-widest text-white">
                            Count: {pagination.totalCount}_Assets
                        </div>
                    </div>

                    {uploads.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {uploads.map((item, i) =>
                                    item.category === "video" || item.category === "show" ? (
                                        <div key={item.id} className="col-span-2 md:col-span-1">
                                            <VideoCard
                                                id={item.id}
                                                title={item.title}
                                                artist={item.artist}
                                                type={item.type}
                                                res={item.res}
                                                isSerial={item.isSerial}
                                                thumbnailUrl={item.thumbnailUrl}
                                                delay={i * 0.1}
                                            />
                                        </div>
                                    ) : (
                                        <div key={item.id} className="col-span-1">
                                            <ImageCard
                                                id={item.id}
                                                title={item.title}
                                                artist={item.artist}
                                                res={item.res}
                                                isSerial={item.isSerial}
                                                thumbnailUrl={item.thumbnailUrl}
                                                delay={item.delay || i * 0.1}
                                            />
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Pagination Controls */}
                            <div className="mt-32 flex items-center justify-between border-t border-white/5 pt-10">
                                <span className="font-tactical text-[9px] opacity-30 uppercase tracking-widest text-white">
                                    Index: {String(pagination.currentPage).padStart(2, "0")} /{" "}
                                    {String(pagination.totalPages).padStart(2, "0")}
                                </span>
                                <div className="flex">
                                    {pagination.currentPage > 1 && (
                                        <Link
                                            href={`?page=${pagination.currentPage - 1}`}
                                            className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase text-white"
                                        >
                                            Prev
                                        </Link>
                                    )}
                                    <div className="w-10 h-10 border border-white bg-white text-black flex items-center justify-center font-tactical text-[10px] tabular-nums">
                                        {String(pagination.currentPage).padStart(2, "0")}
                                    </div>
                                    {pagination.currentPage < pagination.totalPages && (
                                        <Link
                                            href={`?page=${pagination.currentPage + 1}`}
                                            className="w-10 h-10 border border-white/10 flex items-center justify-center font-tactical text-[10px] hover:bg-white/5 transition-colors uppercase text-white"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center glass-panel rounded-xl border border-dashed border-white/10 bg-black/20">
                            <p className="font-tactical text-[10px] uppercase tracking-[0.3em] opacity-30 text-white">
                                No_Uploads_Found
                            </p>
                        </div>
                    )}
                </section>
            </main>

            {/* Edit Profile Drawer */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] transition-all duration-500",
                    isDrawerOpen ? "visible" : "invisible"
                )}
            >
                <div
                    onClick={() => setIsDrawerOpen(false)}
                    className={cn(
                        "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                        isDrawerOpen ? "opacity-100" : "opacity-0"
                    )}
                />
                <div
                    className={cn(
                        "absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-[#0a0a0a] border-l border-white/10 p-6 sm:p-8 transition-transform duration-500 ease-out flex flex-col shadow-2xl overflow-y-auto",
                        isDrawerOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="flex justify-between items-center mb-12 text-white">
                        <div>
                            <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-1 opacity-30">
                                Account_Settings
                            </p>
                            <h2 className="text-2xl font-tactical font-bold tracking-tighter uppercase italic">
                                Module_Update
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="w-10 h-10 flex items-center justify-center hover:opacity-50 transition-opacity"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="w-32 h-32 rounded-full border-2 border-white/10 overflow-hidden bg-neutral-900 flex items-center justify-center relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    className="w-full h-full object-cover"
                                    alt="Avatar Preview"
                                />
                            ) : (
                                <span className="text-[10px] opacity-20 uppercase font-tactical tracking-widest text-white">
                                    No_Preview
                                </span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                            <span className="absolute bottom-2 text-[8px] font-tactical uppercase tracking-widest opacity-60 text-white">
                                Preview
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-8 flex-1">
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical text-white">
                                Identification // Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-4 rounded text-sm font-tactical focus:border-white focus:outline-none transition-colors text-white"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical text-white">
                                Visual_ID // Avatar Upload
                            </label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    name="avatarFile"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full bg-white/5 border border-white/10 border-dashed p-4 rounded text-sm font-tactical flex items-center justify-center gap-2 group-hover:bg-white/10 transition-colors text-white">
                                    <Upload className="w-4 h-4 opacity-40" />
                                    <span className="text-[10px] opacity-40 uppercase tracking-widest">
                                        Select_Module_Image
                                    </span>
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="block text-[8px] uppercase tracking-widest opacity-30 font-tactical mb-1 text-center text-white">
                                    — OR EXTERNAL URL —
                                </label>
                                <input
                                    type="text"
                                    name="avatarUrl"
                                    value={avatarUrl}
                                    onChange={(e) => {
                                        setAvatarUrl(e.target.value);
                                        setAvatarPreview(e.target.value);
                                    }}
                                    placeholder="https://..."
                                    className="w-full bg-white/5 border border-white/10 p-2 rounded text-[10px] font-tactical focus:border-white focus:outline-none transition-colors opacity-50 focus:opacity-100 text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <label className="block text-[10px] uppercase tracking-widest opacity-40 font-tactical text-white">
                                    Security_Cycle // Access Key
                                </label>
                                {!generatedPassword && (
                                    <button
                                        type="button"
                                        onClick={generateSecureKey}
                                        className="text-[9px] font-tactical uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        [ Generate_New_Key ]
                                    </button>
                                )}
                            </div>

                            {generatedPassword ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="relative group">
                                        <div className="w-full bg-white/5 border border-emerald-500/30 p-4 rounded text-[10px] font-mono break-all text-emerald-200 leading-relaxed">
                                            {generatedPassword}
                                            <input type="hidden" name="password" value={generatedPassword} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={copyToClipboard}
                                            className="absolute top-2 right-2 p-2 bg-black/60 border border-white/10 rounded hover:bg-emerald-500/20 transition-all group"
                                            title="Copy to terminal"
                                        >
                                            {isCopied ? (
                                                <span className="text-[8px] text-emerald-400 font-tactical uppercase">Copied!</span>
                                            ) : (
                                                <Upload className="w-3 h-3 text-white/40 group-hover:text-white" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 p-4 rounded">
                                        <input
                                            type="checkbox"
                                            id="confirmSave"
                                            checked={hasConfirmedSave}
                                            onChange={(e) => setHasConfirmedSave(e.target.checked)}
                                            className="w-4 h-4 bg-black border-white/20 rounded cursor-pointer accent-emerald-500"
                                        />
                                        <label htmlFor="confirmSave" className="text-[9px] uppercase tracking-widest opacity-60 cursor-pointer select-none text-white">
                                            I have manually logged this key. It will not be shown again.
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setGeneratedPassword("");
                                            setHasConfirmedSave(false);
                                        }}
                                        className="text-[8px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity text-white"
                                    >
                                        [ Cancel_Key_Rotation ]
                                    </button>
                                </div>
                            ) : (
                                <p className="text-[9px] opacity-20 font-tactical uppercase tracking-[0.2em] text-white">
                                    Current security credentials active. No rotation pending.
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="text-red-400 text-[10px] uppercase tracking-widest">
                                Error: {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving || (!!generatedPassword && !hasConfirmedSave)}
                            className="w-full py-5 bg-white text-black font-tactical font-bold uppercase tracking-[0.4em] text-xs hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all mt-auto flex items-center justify-center gap-2"
                        >
                            <span>{isSaving ? "Synchronizing..." : "Commit_Changes"}</span>
                            {isSaving && (
                                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
