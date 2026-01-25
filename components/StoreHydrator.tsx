"use client";

import { useEffect, useRef } from 'react';
import { InventoryItem } from '@/lib/types';
import { useCartStore } from '@/lib/store';

export const StoreHydrator = ({ inventory }: { inventory: InventoryItem[] }) => {
    // We use a ref to ensure this only runs once per hydration
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            // Hydrate the store's item prices if they exist in cart
            useCartStore.setState((state) => ({
                items: state.items.map(cartItem => {
                    const freshItem = inventory.find(i => i.id === cartItem.id);
                    if (freshItem) {
                        // Update price and stock silently
                        return {
                            ...cartItem,
                            price: freshItem.price || cartItem.price,
                            stock: freshItem.stock_quantity ?? cartItem.stock
                        };
                    }
                    return cartItem;
                })
            }));

            initialized.current = true;
        }
    }, [inventory]);

    return null;
};
