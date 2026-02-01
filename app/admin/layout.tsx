
import { Metadata } from 'next';

import AdminNav from './admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'ZEUZ // CONTROL',
    description: 'Admin Dashboard',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 text-black font-mono-spec">
            <AdminNav />
            <main className="pt-24 px-4 md:px-12 max-w-7xl mx-auto pb-20">
                {children}
            </main>
        </div>
    );
}
