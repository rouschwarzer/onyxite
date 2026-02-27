import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, ne, desc, and, isNull, sql } from "drizzle-orm";
import { getFileUrl, getVideoAssets } from "@/lib/r2";
import { redirect } from "next/navigation";
import { UserView } from "@/components/UserView";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * User profile page.
 * Fetches user info and their uploads on the server.
 * @param props - Component properties with searchParams
 * @returns User profile React component
 */
export default async function UserPage(props: {
    searchParams: Promise<{ page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const pageParam = searchParams.page;
    const currentPage = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const ITEMS_PER_PAGE = 24;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const { data: session } = await auth.getSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Fetch user profile from database to get custom avatar/username
    let [dbUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, session.user.id))
        .limit(1);

    // If user doesn't exist in local DB by ID, check by username (to handle seeded accounts)
    if (!dbUser) {
        const username = session.user.name || session.user.email.split("@")[0];

        // 1. Try to find by username
        [dbUser] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.username, username))
            .limit(1);

        if (!dbUser) {
            // 2. Brand new user - create record
            [dbUser] = await db
                .insert(schema.users)
                .values({
                    id: session.user.id,
                    username,
                    passwordHash: "SOCIAL_AUTH",
                    avatarUrl: session.user.image || null,
                    role: (session.user as any).role || "user",
                })
                .returning();
        }
        // Note: We avoid updating the ID if dbUser was found by name 
        // to prevent foreign key violations with existing content.
    }

    const username = dbUser.username;
    const userRole = dbUser.role;

    // Base conditions for PostgreSQL schema
    const uploadWhere = and(
        eq(schema.content.uploaderId, dbUser.id),
        eq(schema.content.status, "active")
    );

    // Fetch Total Count for Pagination
    const [{ count: totalCountRow }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(schema.content)
        .where(uploadWhere);

    const totalCount = totalCountRow || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

    // Fetch User's Uploads via Content table join
    const userUploadsQuery = await db
        .select({
            id: schema.content.id,
            title: schema.content.name,
            category: schema.content.category,
            mimeType: schema.files.mimeType,
            objectKey: schema.files.objectKey,
            metadata: schema.content.processedMetadata,
        })
        .from(schema.content)
        .leftJoin(schema.files, eq(schema.content.fileId, schema.files.id))
        .where(uploadWhere)
        .orderBy(desc(schema.content.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);

    const userUploads = await Promise.all(
        userUploadsQuery.map(async (f) => {
            const assets = await getVideoAssets(f.objectKey, f.metadata);
            return {
                id: f.id,
                title: f.title,
                thumbnailUrl: assets.poster || "/placeholder.png",
                previewUrl: assets.preview,
                artist: username,
                type: f.mimeType?.startsWith("video") ? "Video" : (f.category || "Media"),
                res: "SRC",
                isSerial:
                    f.category === "show" ||
                    f.category === "series" ||
                    f.category === "comic" ||
                    f.category === "gallery",
            };
        })
    );

    const joinedDate = dbUser.createdAt
        ? new Date(dbUser.createdAt as any).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        : "N/A";

    return (
        <UserView
            user={{
                id: dbUser.id,
                username: dbUser.username,
                role: dbUser.role,
                avatarUrl: dbUser.avatarUrl,
                joinedDate,
            }}
            uploads={userUploads}
            pagination={{
                currentPage,
                totalPages,
                totalCount,
            }}
        />
    );
}
