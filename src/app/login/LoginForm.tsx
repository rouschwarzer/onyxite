"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginFormProps {
    loginAction: (formData: FormData) => void;
    error?: string;
}

/**
 * Client-side login form component with password visibility toggle.
 * @param props - Component properties
 * @returns React component for login form
 */
export function LoginForm({ loginAction, error }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form action={loginAction} className="space-y-6">
            <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-2 text-white">
                    Username
                </label>
                <input
                    type="text"
                    name="username"
                    required
                    className="w-full bg-black/50 border border-white/20 p-3 rounded text-sm focus:border-white focus:outline-none transition-colors text-white"
                    placeholder="OPERATOR_NAME"
                />
            </div>

            <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-2 text-white">
                    Access Key
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        className="w-full bg-black/50 border border-white/20 p-3 pr-10 rounded text-sm focus:border-white focus:outline-none transition-colors text-white"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded text-xs tracking-widest uppercase text-center">
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-[0.3em] hover:bg-gray-200 transition-colors mt-8 rounded"
            >
                Authenticate
            </button>
        </form>
    );
}
