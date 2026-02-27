import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, contentTags, tags, artists, contentArtists } from "@/db/schema";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

/**
 * POST handler to update content metadata.
 * @param request - The incoming request object
 * @returns Response with success status
 */
export async function POST(request: NextRequest) {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { contentId, name, artistName, description, selectedTags } =
            await request.json();

        if (!contentId) {
            return new NextResponse("Missing contentId", { status: 400 });
        }

        // 1. Update Content Basic Info
        const updateData: any = {
            name: name,
            description: description,
            updatedAt: new Date(),
        };

        await db.update(content).set(updateData).where(eq(content.id, contentId));

        // 1.5. Update Artist (Single primary author logic)
        if (artistName !== undefined) {
            const normalizedArtist = artistName?.trim();

            // Remove existing author roles for this content
            await db.delete(contentArtists).where(eq(contentArtists.contentId, contentId));

            if (normalizedArtist) {
                // Find or create artist
                let [artist] = await db
                    .select()
                    .from(artists)
                    .where(eq(artists.name, normalizedArtist))
                    .limit(1);

                if (!artist) {
                    const artistId = crypto.randomUUID();
                    await db.insert(artists).values({
                        id: artistId,
                        name: normalizedArtist,
                    });
                    [artist] = await db.select().from(artists).where(eq(artists.id, artistId)).limit(1);
                }

                if (artist) {
                    await db.insert(contentArtists).values({
                        contentId: contentId,
                        artistId: artist.id,
                        role: "author",
                    });
                }
            }
        }


        // 2. Update Tags (Delete existing and re-insert)
        if (Array.isArray(selectedTags)) {
            // Remove existing tag associations
            await db.delete(contentTags).where(eq(contentTags.contentId, contentId));

            // Insert new ones
            for (const tagName of selectedTags) {
                if (!tagName) continue;
                const normalizedName = tagName.toLowerCase().trim();
                if (!normalizedName) continue;

                // Ensure tag exists
                let [tag] = await db
                    .select()
                    .from(tags)
                    .where(eq(tags.name, normalizedName))
                    .limit(1);

                if (!tag) {
                    // Create tag if it doesn't exist
                    const tagId = crypto.randomUUID();
                    await db.insert(tags).values({
                        id: tagId,
                        name: normalizedName,
                    });

                    [tag] = await db
                        .select()
                        .from(tags)
                        .where(eq(tags.id, tagId))
                        .limit(1);
                }

                if (tag) {
                    await db.insert(contentTags).values({
                        contentId: contentId,
                        tagId: tag.id,
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Update meta error:", e);
        return new NextResponse("System Error: " + e.message, { status: 500 });
    }
}

