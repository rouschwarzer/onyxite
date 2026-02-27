import { db } from "@/db";
import { content, users, tags } from "@/db/schema";
import { count, desc } from "drizzle-orm";
import { Navigation } from "@/components/Navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Admin Dashboard page.
 * Displays system statistics and management logs.
 * Restricted to users with "admin" role.
 * @returns Dashboard React component
 */
export default async function DashboardPage() {
    const { data: session } = await auth.getSession();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "admin") {
        redirect("/");
    }

    // List users from Neon Auth
    const { data: neonUsers } = await auth.admin.listUsers({
        query: { limit: 100 }
    });
    const authUsers = neonUsers?.users || [];

    // Stats
    const [{ value: contentCount }] = await db
        .select({ value: count() })
        .from(content);
    const [{ value: usersCount }] = await db
        .select({ value: count() })
        .from(users);
    const [{ value: tagsCount }] = await db.select({ value: count() }).from(tags);

    // Recent items (Content)
    const recentContent = await db
        .select({
            id: content.id,
            name: content.name,
            category: content.category,
            status: content.status,
            createdAt: content.createdAt,
        })
        .from(content)
        .orderBy(desc(content.createdAt))
        .limit(10);
    // Use the combined set of users if needed, or just authUsers
    const displayUsers = authUsers;

    return (
        <>
            <Navigation userRole={session.user.role} />

            <main className="max-w-6xl mx-auto mt-32 px-4 relative z-0 pb-32">
                <header className="mb-16 border-l-2 border-white/20 pl-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <p className="font-tactical text-[9px] uppercase tracking-[0.6em] mb-2 opacity-30 text-white">
                            Command_Center
                        </p>
                        <h2 className="text-4xl font-tactical font-bold tracking-tighter uppercase italic text-white text-white">
                            System_Dashboard
                        </h2>
                    </div>
                    <div className="flex gap-8 text-white">
                        <div className="text-right">
                            <p className="text-[8px] uppercase tracking-widest opacity-20 font-tactical">
                                Assets
                            </p>
                            <p className="text-xl font-tactical font-bold">{contentCount}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] uppercase tracking-widest opacity-20 font-tactical">
                                Users
                            </p>
                            <p className="text-xl font-tactical font-bold">{usersCount}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] uppercase tracking-widest opacity-20 font-tactical">
                                Tags
                            </p>
                            <p className="text-xl font-tactical font-bold">{tagsCount}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-12">
                    {/* USER MANAGEMENT */}
                    <section className="glass-panel border border-white/10 p-8 rounded-2xl bg-black/20 text-white">
                        <h3 className="font-tactical text-xs uppercase tracking-[0.4em] mb-8 opacity-40 italic font-bold">
                            User_Registry
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-tactical text-[11px]">
                                <thead>
                                    <tr className="border-b border-white/10 opacity-30 uppercase tracking-widest">
                                        <th className="pb-4 font-normal">UID</th>
                                        <th className="pb-4 font-normal">Username</th>
                                        <th className="pb-4 font-normal">Role</th>
                                        <th className="pb-4 font-normal">Registry_Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {displayUsers.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="group hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-4 opacity-30 font-mono text-[9px]">
                                                {u.id.substring(0, 8)}...
                                            </td>
                                            <td className="py-4 font-bold tracking-tight">
                                                {u.name || u.email}
                                            </td>
                                            <td className="py-4 uppercase tracking-widest text-[9px]">
                                                <span
                                                    className={
                                                        u.role === "admin"
                                                            ? "text-emerald-400"
                                                            : "opacity-40"
                                                    }
                                                >
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-4 opacity-40">
                                                {u.createdAt ? new Date(u.createdAt as any).toLocaleDateString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* FILE MANAGEMENT */}
                    <section className="glass-panel border border-white/10 p-8 rounded-2xl bg-black/20 text-white">
                        <h3 className="font-tactical text-xs uppercase tracking-[0.4em] mb-8 opacity-40 italic font-bold">
                            Storage_Log // Recent_Uploads
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-tactical text-[11px]">
                                <thead>
                                    <tr className="border-b border-white/10 opacity-30 uppercase tracking-widest">
                                        <th className="pb-4 font-normal">Module_ID</th>
                                        <th className="pb-4 font-normal">Name</th>
                                        <th className="pb-4 font-normal">Category</th>
                                        <th className="pb-4 font-normal">Status</th>
                                        <th className="pb-4 font-normal">Commit_Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentContent.map((f) => (
                                        <tr
                                            key={f.id}
                                            className="group hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-4 opacity-30 font-mono text-[9px]">
                                                {f.id.substring(0, 8)}...
                                            </td>
                                            <td className="py-4 font-bold tracking-tight truncate max-w-[200px]">
                                                {f.name}
                                            </td>
                                            <td className="py-4 uppercase tracking-widest text-[8px] opacity-60">
                                                {f.category}
                                            </td>
                                            <td className="py-4 uppercase tracking-widest text-[8px] italic">
                                                {f.status}
                                            </td>
                                            <td className="py-4 opacity-40">
                                                {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5 text-right">
                            <Link
                                href="/streams"
                                className="text-[9px] uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
                            >
                                Access_Full_Archive →
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
