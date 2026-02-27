import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

/**
 * POST handler to log out the user using Neon Auth.
 * @returns Redirect response to login page
 */
export async function POST() {
    await auth.signOut();
    redirect("/login");
}
