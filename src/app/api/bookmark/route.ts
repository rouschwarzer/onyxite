import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

/**
 * POST handler to toggle a bookmark.
 * @param request - The incoming request object
 * @returns Response with saved status (true if added, false if removed)
 */
export async function POST(request: NextRequest) {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { contentId } = await request.json();
        if (!contentId) {
            return new NextResponse("Missing contentId", { status: 400 });
        }

        // Check if already bookmarked
        const [existing] = await db
            .select()
            .from(bookmarks)
            .where(and(eq(bookmarks.userId, userId), eq(bookmarks.contentId, contentId)))
            .limit(1);

        if (existing) {
            // Remove bookmark
            await db
                .delete(bookmarks)
                .where(and(eq(bookmarks.userId, userId), eq(bookmarks.contentId, contentId)));
            return NextResponse.json({ saved: false });
        } else {
            // Add bookmark
            await db.insert(bookmarks).values({
                userId,
                contentId,
            });
            return NextResponse.json({ saved: true });
        }
    } catch (e) {
        console.error("Bookmark error:", e);
        return new NextResponse("System Error", { status: 500 });
    }
}
