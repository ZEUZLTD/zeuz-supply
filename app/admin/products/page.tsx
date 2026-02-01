
import Link from 'next/link';
import { getProducts } from './product-actions';

export const dynamic = 'force-dynamic';

export default async function ProductsListPage() {
    const products = await getProducts();

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                <h1 className="text-4xl font-black">INVENTORY</h1>
                <Link href="/admin/products/new" className="bg-black text-white px-6 py-3 font-bold uppercase hover:bg-amber-500 hover:text-black transition-colors w-full sm:w-auto text-center">
                    + NEW PRODUCT
                </Link>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-gray-100 text-gray-500 uppercase tracking-wider text-xs font-bold">
                            <tr>
                                <th className="p-4 border-b">Product</th>
                                <th className="p-4 border-b">Category</th>
                                <th className="p-4 border-b">Price (£)</th>
                                <th className="p-4 border-b">Stock (Cells)</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono">
                            {products?.map((p) => {
                                // Color code categories
                                const catColor = p.category === 'POWER' ? 'text-red-500' : p.category === 'ENERGY' ? 'text-blue-500' : 'text-gray-400';

                                // Calculate total stock from batches
                                const totalStock = p.batches?.reduce((acc: number, b: { stock_quantity?: number }) => acc + (b.stock_quantity || 0), 0) || 0;

                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold">{p.model}</div>
                                            <div className="text-xs text-gray-400">{p.slug}</div>
                                        </td>
                                        <td className={`p-4 font-bold ${catColor}`}>{p.category}</td>
                                        <td className="p-4">£{p.price_gbp?.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${totalStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {totalStock}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link href={`/admin/products/${p.slug}`} className="text-blue-600 hover:underline font-bold text-xs uppercase">
                                                EDIT
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {products?.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic">
                        No products found. Start by adding one.
                    </div>
                )}
            </div>
        </div>
    );
}
