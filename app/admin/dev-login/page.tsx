"use client";

import { useRouter } from "next/navigation";

export default function DevLoginPage() {
    const router = useRouter();

    const enableDevMode = () => {
        // Set cookie valid for 1 day
        document.cookie = "zeuz_dev_admin=true; path=/; max-age=86400";
        router.push("/admin");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center space-y-4 border border-white/20 p-12">
                <h1 className="text-2xl font-bold font-mono text-red-500">DEV OVERRIDE</h1>
                <p className="text-xs text-gray-400 font-mono">
                    Bypassing Authentication for Audit.<br />
                    Ensure &apos;temp_dev_access.sql&apos; is run first.
                </p>
                <button
                    onClick={enableDevMode}
                    className="bg-white text-black px-6 py-2 font-bold uppercase hover:bg-gray-200"
                >
                    ENTER ADMIN MODE
                </button>
            </div>
        </div>
    );
}
