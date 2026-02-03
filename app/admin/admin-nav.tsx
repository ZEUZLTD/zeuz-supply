"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingBag, BarChart3, Tag, LogOut, Megaphone, Target, Menu, X } from "lucide-react";
import { useState } from "react";

export default function AdminNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

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
                    <Link href="/admin" className="font-black tracking-tighter text-xl z-50 relative">
                        ZEUZ <span className="text-gray-500">{"// CONTROL"}</span>
                    </Link>

                    {/* Desktop Navigation */}
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
                        className="text-gray-500 hover:text-white hidden md:flex"
                    >
                        <LogOut size={18} />
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-white md:hidden z-50 relative"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black z-40 flex flex-col pt-24 px-4 md:hidden">
                    <div className="flex flex-col gap-2">
                        {links.map(link => {
                            const Icon = link.icon;
                            const isActive = link.href === '/admin'
                                ? pathname === '/admin'
                                : pathname.startsWith(link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "px-4 py-4 rounded-md text-lg font-bold flex items-center gap-4 transition-colors border-b border-gray-900",
                                        isActive
                                            ? "text-white bg-gray-900"
                                            : "text-gray-400 hover:text-white hover:bg-gray-900"
                                    )}
                                >
                                    <Icon size={20} />
                                    {link.label}
                                </Link>
                            )
                        })}
                        <button
                            onClick={() => {/* logout */ }}
                            className="px-4 py-4 rounded-md text-lg font-bold flex items-center gap-4 text-gray-400 hover:text-white hover:bg-gray-900 mt-4 border-t border-gray-800"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
