import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

/**
 * GET handler for the artists API.
 * Fetches all artists sorted by name.
 * @returns Response with artists JSON
 */
export async function GET() {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const allArtists = await db
            .select({
                id: artists.id,
                name: artists.name,
            })
            .from(artists)
            .orderBy(asc(artists.name));

        return NextResponse.json(allArtists);
    } catch (e) {
        console.error("Failed to fetch artists", e);
        return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
    }
}
