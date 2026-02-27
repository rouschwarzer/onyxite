import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadFile, getFileUrl } from "@/lib/r2";
import { auth } from "@/lib/auth/server";

/**
 * POST handler to update user account details.
 * Handles username, password, and avatar updates (file or URL).
 * @param request - The incoming request object
 * @returns Response with success status
 */
export async function POST(request: NextRequest) {
    console.log("[PROTOCOL_SYNC] Initiating account update procedure...");
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    console.log(`[PROTOCOL_SYNC] Target ID: ${userId}`);

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await request.formData();
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const avatarFile = formData.get("avatarFile") as File;
        const avatarUrl = formData.get("avatarUrl") as string;

        // Note: Password update for Neon Auth should be done via Neon Auth APIs or forgot password flow
        // For now, we update our local users table if we still use it for profile indexing
        const updateData: any = {};

        if (username) updateData.username = username;

        // Apply Password Update via Neon Auth Admin API
        if (password) {
            console.log(`[PROTOCOL_SYNC] Rotating security credentials for: ${userId}`);
            const { error: pwError } = await auth.admin.setUserPassword({
                userId: userId,
                newPassword: password,
            });

            if (pwError) {
                console.error("[PROTOCOL_SYNC] Password update failed:", pwError);
                return new NextResponse(`Security Update Failed: ${pwError.message}`, { status: 500 });
            }
        }

        // Apply metadata updates (name/username)
        if (username) {
            const { error: profileError } = await auth.admin.updateUser({
                userId: userId,
                data: { name: username },
            });

            if (profileError) {
                console.error("[PROTOCOL_SYNC] Profile metadata update failed:", profileError);
                // We continue if only name fails, or return error? Let's return error for safety.
                return new NextResponse(`Profile Sync Failed: ${profileError.message}`, { status: 500 });
            }
        }

        // Handle Avatar Upload
        if (avatarFile && avatarFile.size > 0) {
            const key = `avatars/${userId}-${Date.now()}-${avatarFile.name}`;
            await uploadFile(avatarFile, key, avatarFile.type);
            updateData.avatarUrl = await getFileUrl(key);
        } else if (avatarUrl) {
            updateData.avatarUrl = avatarUrl;
        }

        if (Object.keys(updateData).length === 0 && !password) {
            return new NextResponse("No data to update", { status: 400 });
        }

        // Locate user in local DB (Check by ID first, then fallback to username for seeded accounts)
        let [localUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!localUser && username) {
            [localUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
        }

        if (!localUser) {
            // Brand new profile record
            console.log("[PROTOCOL_SYNC] Creating new registry entry...");
            await db.insert(users).values({
                id: userId,
                username: username || session.user.name || "Anonymous",
                avatarUrl: updateData.avatarUrl || session.user.image,
                role: session.user.role || "user",
                createdAt: new Date(),
            });
        } else {
            // Update existing registry entry (ensure we use the correct record ID)
            console.log(`[PROTOCOL_SYNC] Updating existing registry: ${localUser.id}`);
            await db.update(users).set(updateData).where(eq(users.id, localUser.id));
        }

        return NextResponse.json({
            success: true,
            requiresLogout: !!password
        });
    } catch (e: any) {
        console.error("Account update error:", e);
        if (e.message?.includes("UNIQUE constraint failed: users.username")) {
            return new NextResponse("Username already taken", { status: 400 });
        }
        return new NextResponse("System Error: " + (e.message || "Unknown error"), { status: 500 });
    }
}
