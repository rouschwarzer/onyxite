import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

/**
 * GET handler for the tags API.
 * Fetches all tags sorted by name.
 * @returns Response with tags JSON
 */
export async function GET() {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const allTags = await db
            .select({
                id: tags.id,
                name: tags.name,
            })
            .from(tags)
            .orderBy(asc(tags.name));

        return NextResponse.json(allTags);
    } catch (e) {
        console.error("Failed to fetch tags", e);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}
