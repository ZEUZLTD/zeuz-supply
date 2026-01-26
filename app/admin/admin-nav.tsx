'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, Megaphone, Package, ShoppingCart, Tag, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navItems = [
        { href: '/admin', label: 'DASHBOARD', icon: LayoutDashboard },
        { href: '/admin/marketing', label: 'MARKETING', icon: Megaphone },
        { href: '/admin/products', label: 'PRODUCTS', icon: Package },
        { href: '/admin/orders', label: 'ORDERS', icon: ShoppingCart },
        { href: '/admin/vouchers', label: 'VOUCHERS', icon: Tag },
        { href: '/admin/discounts', label: 'DISCOUNTS', icon: Percent },
    ];

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6">
            <div className="font-bold tracking-tighter text-xl z-50 relative bg-white">
                ZEUZ <span className="text-gray-400">//</span> CONTROL
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={toggleMenu}
                className="md:hidden z-50 relative p-2 -mr-2 text-black hover:text-amber-500 transition-colors"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6 text-sm items-center">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "hover:text-amber-500 transition-colors flex items-center gap-2",
                            isActive(item.href) ? "text-black font-bold border-b-2 border-black" : "text-gray-600"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
                <Link
                    href="/"
                    className="bg-black text-white px-3 py-1 text-xs font-bold uppercase hover:bg-amber-500 hover:text-black transition-colors flex items-center gap-2 ml-4"
                >
                    <LogOut size={12} />
                    EXIT TO STORE
                </Link>
            </div>

            {/* Mobile Navigation Overlay */}
            <div className={cn(
                "fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out md:hidden flex flex-col pt-24 px-6",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col gap-6 text-lg font-bold">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className={cn(
                                "flex items-center gap-4 py-2 border-b border-gray-100 hover:text-amber-500 transition-colors",
                                isActive(item.href) ? "text-black border-black border-l-4 pl-3 bg-gray-50" : "text-gray-600"
                            )}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    ))}
                    <div className="mt-8">
                        <Link
                            href="/"
                            onClick={closeMenu}
                            className="bg-black text-white px-6 py-4 text-sm font-bold uppercase hover:bg-amber-500 hover:text-black transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            <LogOut size={16} />
                            EXIT TO STORE
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
