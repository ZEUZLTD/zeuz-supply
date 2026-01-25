
import { Metadata } from 'next';
import Link from 'next/link';

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
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6">
                <div className="font-bold tracking-tighter text-xl">
                    ZEUZ <span className="text-gray-400">//</span> CONTROL
                </div>
                <div className="flex gap-6 text-sm">
                    <Link href="/admin" className="hover:text-amber-500">DASHBOARD</Link>
                    <Link href="/admin/marketing" className="hover:text-amber-500">MARKETING</Link>
                    <Link href="/admin/products" className="hover:text-amber-500">PRODUCTS</Link>
                    <Link href="/admin/orders" className="hover:text-amber-500">ORDERS</Link>
                    <Link href="/admin/vouchers" className="hover:text-amber-500">VOUCHERS</Link>
                    <Link href="/" className="bg-black text-white px-3 py-1 text-xs font-bold uppercase hover:bg-amber-500 hover:text-black transition-colors">
                        EXIT TO STORE
                    </Link>
                </div>
            </nav>
            <main className="pt-24 px-6 md:px-12 max-w-7xl mx-auto pb-20">
                {children}
            </main>
        </div>
    );
}
