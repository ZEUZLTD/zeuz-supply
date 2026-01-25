import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store";
import { InventoryItem } from "@/lib/types";
import { ProductDetailContent } from "@/components/ProductDetailContent";

export const ProductDetailView = ({ items }: { items: InventoryItem[] }) => {
    const { viewingProduct, setViewingProduct } = useUIStore();
    const product = items.find(i => i.id === viewingProduct);

    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-[var(--color-background)] flex flex-col items-center justify-center overflow-hidden"
                >
                    <ProductDetailContent
                        product={product}
                        isModal={true}
                        onClose={() => setViewingProduct(null)}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
