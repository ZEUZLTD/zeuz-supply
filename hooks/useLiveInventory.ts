"use client";

import { useEffect, useState } from 'react';
import { InventoryItem } from '@/lib/types';

export function useLiveInventory(initialInventory: InventoryItem[]) {
    const [inventory, setInventory] = useState(initialInventory);

    useEffect(() => {
        const fetchLive = async () => {
            try {
                // Cache Busting: Append timestamp
                const res = await fetch(`/api/live-inventory?_t=${Date.now()}`, {
                    headers: { 'Accept': 'application/json' }
                });
                if (!res.ok) return;
                const data = await res.json();

                // Handle new API structure { products: ..., volume_discounts: ... }
                const liveMap = data.products || data;
                const tiers = data.volume_discounts;

                // Sync Global Volume Tiers if available
                if (tiers) {
                    const { useCartStore } = await import('@/lib/store');
                    useCartStore.setState({ volumeTiers: tiers });
                }

                if (liveMap) {
                    setInventory(prev => prev.map(item => {
                        const fresh = liveMap[item.id];
                        if (fresh) {
                            // Determine status
                            let status = item.status;
                            if (item.category === 'PROTOTYPE') {
                                status = 'COMING_SOON';
                            } else if (fresh.stock > 20) {
                                status = 'IN_STOCK';
                            } else if (fresh.stock > 0) {
                                status = 'LOW_STOCK';
                            } else {
                                status = 'OUT_OF_STOCK';
                            }

                            return {
                                ...item,
                                price: fresh.price,
                                stock_quantity: fresh.stock,
                                status: status
                            };
                        }
                        return item;
                    }));
                }
            } catch (e) {
                console.error("Live Fetch Error", e);
            }
        };

        // Initial fetch on mount
        fetchLive();

        // Poll every 30 seconds
        const interval = setInterval(fetchLive, 30000);
        return () => clearInterval(interval);
    }, []);

    return inventory;
}
