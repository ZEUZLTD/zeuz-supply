"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '@/lib/types';

export function useLiveProduct(initialProduct: InventoryItem) {
    const [product, setProduct] = useState(initialProduct);

    useEffect(() => {
        // Reset when slug changes
        setProduct(initialProduct);

        const fetchLive = async () => {
            try {
                // Fetch just this ID with Cache Busting
                const res = await fetch(`/api/live-inventory?ids=${initialProduct.id}&_t=${Date.now()}`);
                if (!res.ok) return;
                const liveMap = await res.json();
                const fresh = liveMap[initialProduct.id];

                if (fresh) {
                    // Determine status
                    let status = initialProduct.status;
                    if (initialProduct.category === 'PROTOTYPE') {
                        status = 'COMING_SOON';
                    } else if (fresh.stock > 20) {
                        status = 'IN_STOCK';
                    } else if (fresh.stock > 0) {
                        status = 'LOW_STOCK';
                    } else {
                        status = 'OUT_OF_STOCK';
                    }

                    setProduct(prev => ({
                        ...prev,
                        price: fresh.price,
                        stock_quantity: fresh.stock,
                        status: status
                    }));
                }
            } catch (e) {
                console.error("Live Product Error", e);
            }
        };

        // Initial fetch
        fetchLive();

        // Poll every 30 seconds
        const interval = setInterval(fetchLive, 30000);
        return () => clearInterval(interval);
    }, [initialProduct.id, initialProduct.category]); // Re-run if ID changes

    return product;
}
