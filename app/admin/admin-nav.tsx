"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingBag, BarChart3, Tag, LogOut, Megaphone, Target } from "lucide-react";

export default function AdminNav() {
    const pathname = usePathname();

    const links = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/admin/products', label: 'Products', icon: Tag },
        { href: '/admin/vouchers', label: 'Vouchers', icon: Tag }, // Using Tag for now
        { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
        { href: '/admin/strategy', label: 'Strategy', icon: Target },
    ];

    return (
        <nav className="fixed top-0 w-full z-50 bg-black text-white h-16 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/admin" className="font-black tracking-tighter text-xl">
                        ZEUZ <span className="text-gray-500">{"// CONTROL"}</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => {
                            const Icon = link.icon;
                            // Exact match for root admin, prefix match for others
                            const isActive = link.href === '/admin'
                                ? pathname === '/admin'
                                : pathname.startsWith(link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors",
                                        isActive
                                            ? "bg-white text-black"
                                            : "text-gray-400 hover:text-white hover:bg-gray-900"
                                    )}
                                >
                                    <Icon size={16} />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {/* logout */ }}
                        className="text-gray-500 hover:text-white"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
