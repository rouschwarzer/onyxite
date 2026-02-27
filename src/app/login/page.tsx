import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

/**
 * Login page component.
 * @param props - Component properties including searchParams
 * @returns Login page React component
 */
export default async function LoginPage(props: {
    searchParams: Promise<{ error?: string }>;
}) {
    const searchParams = await props.searchParams;
    const error = searchParams.error;

    /**
     * Server Action to handle login via Neon Auth.
     * @param formData - The submitted form data
     */
    async function login(formData: FormData) {
        "use server";

        const username = formData.get("username") as string;
        const password = formData.get("password") as string;

        try {
            /** 
             * Map username to an internal email format since Neon Auth 
             * currently expects an email-formatted identifier.
             */
            const internalEmail = `${username.toLowerCase()}@onyxite.site`;

            const { data, error } = await auth.signIn.email({
                email: internalEmail,
                password,
            });

            if (error) {
                redirect(`/login?error=${encodeURIComponent(error.message || 'Auth Failed')}`);
            }

            redirect("/");
        } catch (e: any) {
            /** redirect() throws NEXT_REDIRECT which we must re-throw */
            if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
            console.error(e);
            redirect("/login?error=System Auth Error");
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative font-tactical overflow-hidden bg-bg-deep">
            {/* Grid BG */}
            <div
                className="absolute inset-0 z-0 opacity-10"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            ></div>

            <div className="glass-panel p-8 md:p-12 border border-white/10 rounded-xl w-full max-w-md relative z-10 shadow-2xl bg-black/40 backdrop-blur-xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold uppercase tracking-[0.2em] italic mb-2 text-white">
                        Onyxite
                    </h1>
                    <p className="text-[10px] tracking-widest opacity-40 uppercase text-white">
                        Restricted Access // Auth Required
                    </p>
                </div>

                <LoginForm loginAction={login} error={error} />
            </div>
        </main>
    );
}
