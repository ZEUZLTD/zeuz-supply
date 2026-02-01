import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { VolumeTier } from './types';

export interface CartItem {
    id: string;
    model: string;
    price: number;
    quantity: number;
    stock?: number;
}

export type SectionType = 'POWER' | 'ENERGY' | 'PROTOTYPE' | 'HERO';

interface ContactContext {
    productId?: string;
    productModel?: string;
    quantity?: number | string;
}

// VolumeTier moved to types.ts

interface UIStore {
    // ... existing ...
    activeSection: SectionType;
    setActiveSection: (section: SectionType) => void;
    newsletterSource: string | null;
    setNewsletterSource: (source: string | null) => void;
    viewingProduct: string | null;
    setViewingProduct: (id: string | null) => void;
    hoveredProduct: string | null;
    setHoveredProduct: (model: string | null) => void;
    themeColor: string;
    setThemeColor: (color: string) => void;
    user: User | null;
    setUser: (user: User | null) => void;
    contactMode: 'NEWSLETTER' | 'STOCK_NOTIFY' | 'PROTO_WAITLIST' | 'BULK_QUOTE' | 'GENERAL';
    contactContext: ContactContext | null;
    setContactMode: (mode: UIStore['contactMode'], context?: ContactContext) => void;
    orderRefreshSignal: number;
    triggerOrderRefresh: () => void;
}

interface CartStore {
    items: CartItem[];
    volumeTiers: VolumeTier[];
    isOpen: boolean;
    activeTab: 'cart' | 'account';
    addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openAccount: () => void;
    total: () => number;
    subtotal: () => number;
    syncPrices: () => Promise<void>;
    mergeServerCart: (items: CartItem[]) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    activeSection: 'POWER',
    setActiveSection: (section) => set({ activeSection: section }),
    newsletterSource: null,
    setNewsletterSource: (source) => set({ newsletterSource: source }),
    viewingProduct: null,
    setViewingProduct: (id) => set({ viewingProduct: id }),
    hoveredProduct: null,
    setHoveredProduct: (model) => set({ hoveredProduct: model }),
    themeColor: '#D946EF', // Default Purple
    setThemeColor: (color) => set({ themeColor: color }),
    user: null,
    setUser: (user) => set({ user: user }),
    contactMode: 'NEWSLETTER',
    contactContext: null,
    setContactMode: (mode, context) => set({ contactMode: mode, contactContext: context || null }),
    orderRefreshSignal: 0,
    triggerOrderRefresh: () => set({ orderRefreshSignal: Date.now() }),
}));

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            volumeTiers: [],
            isOpen: false,
            activeTab: 'cart',
            addItem: (item, qty = 1) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((i) => i.id === item.id);
                // Strict Stock Check on Add
                const stockLimit = item.stock || 9999;

                if (existingItem) {
                    const newQty = Math.min(existingItem.quantity + qty, stockLimit);
                    const updatedItems = currentItems.map((i) =>
                        i.id === item.id ? { ...i, quantity: newQty } : i
                    );
                    set({ items: updatedItems, isOpen: true, activeTab: 'cart' });
                } else {
                    const newQty = Math.min(qty, stockLimit);
                    set({ items: [...currentItems, { ...item, quantity: newQty }], isOpen: true, activeTab: 'cart' });
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((item) => item.id !== id) });
            },
            updateQuantity: (id, qty) => {
                const currentItems = get().items;
                if (qty <= 0) {
                    set({ items: currentItems.filter((i) => i.id !== id) });
                } else {
                    set({ items: currentItems.map((i) => i.id === id ? { ...i, quantity: qty } : i) });
                }
            },
            clearCart: () => set({ items: [] }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen, activeTab: 'cart' })),
            openAccount: () => set({ isOpen: true, activeTab: 'account' }),

            total: () => {
                return get().items.reduce((sum, item) => {
                    const lineTotal = item.price * item.quantity;
                    const q = item.quantity;

                    // Dynamic Volume Tiers
                    // Find largest tier that satisfies q >= min_quantity
                    const tiers = get().volumeTiers || [];
                    const activeTier = tiers
                        .slice() // Copy to sort safely
                        .sort((a, b) => b.min_quantity - a.min_quantity)
                        .find(t => q >= t.min_quantity);

                    const discount = activeTier ? (activeTier.discount_percent / 100) : 0;

                    return sum + (lineTotal * (1 - discount));
                }, 0);
            },


            subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

            syncPrices: async () => {
                const currentItems = get().items;
                if (currentItems.length === 0) return;

                const ids = currentItems.map(i => i.id);

                try {
                    // Use Proxy API to guarantee same-server permissions
                    // Cache Busting: Append timestamp
                    const res = await fetch(`/api/live-inventory?ids=${ids.join(',')}&_t=${Date.now()}`);
                    if (!res.ok) throw new Error("API Failed");

                    const data = await res.json();
                    // Fallback for old API response style if needed, though we just changed it
                    const liveMap = data.products || data;
                    const tiers = data.volume_discounts || [];

                    set({ volumeTiers: tiers });

                    if (liveMap) {
                        set(state => ({
                            items: state.items.map(item => {
                                const fresh = liveMap[item.id];
                                if (fresh) {
                                    const freshPrice = fresh.price;
                                    const freshStock = fresh.stock;

                                    // Only update if changed
                                    if (freshPrice !== item.price || freshStock !== item.stock) {
                                        return {
                                            ...item,
                                            price: freshPrice || item.price,
                                            stock: freshStock
                                        };
                                    }
                                }
                                return item;
                            })
                        }));
                    }
                } catch (e) {
                    console.error("ZEUZ_SYSTEM: Price Sync Error", e);
                }
            },
            mergeServerCart: (serverItems: CartItem[]) => {
                const localItems = get().items;
                const mergedMap = new Map<string, CartItem>();

                // Add local items first
                localItems.forEach(item => mergedMap.set(item.id, item));

                // Merge server items
                serverItems.forEach(sItem => {
                    const existing = mergedMap.get(sItem.id);
                    if (existing) {
                        // Conflict: Sum quantities
                        // Respect stock limit if we had it, otherwise just sum
                        const limit = existing.stock || 9999;
                        const newQty = Math.min(existing.quantity + sItem.quantity, limit);
                        mergedMap.set(sItem.id, { ...existing, quantity: newQty });
                    } else {
                        mergedMap.set(sItem.id, sItem);
                    }
                });

                set({ items: Array.from(mergedMap.values()) });
            }
        }),
        {
            name: 'zeuz-cart-storage',
            version: 1,
            storage: {
                getItem: (name) => {
                    if (typeof window === 'undefined') return null;
                    const v = localStorage.getItem(name);
                    return v ? JSON.parse(v) : null;
                },
                setItem: (name, value) => {
                    if (typeof window === 'undefined') return;
                    try {
                        const str = JSON.stringify(value);
                        localStorage.setItem(name, str);
                    } catch (err) {
                        console.error("Storage Error", err);
                    }
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                }
            }
        }
    )
);
