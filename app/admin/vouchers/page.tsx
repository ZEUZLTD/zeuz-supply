import { getVouchers } from './actions';
import { getProducts } from '../products/product-actions';
import { Voucher, InventoryItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function VouchersPage({ searchParams = {} }: { searchParams?: { edit?: string } }) {
    console.log("[ADMIN] VouchersPage Render Initiated");

    // Defensive fetching
    let vouchers: Voucher[] = [];
    let products: InventoryItem[] = [];

    try {
        vouchers = (await getVouchers()) || [];
        products = (await getProducts()) || [];
    } catch (e) {
        console.error("[ADMIN] Data Fetch Error:", e);
    }

    const safeVouchers = Array.isArray(vouchers) ? vouchers.filter(Boolean) : [];
    const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];

    const editId = searchParams?.edit;
    const editingVoucher = editId ? safeVouchers.find(v => v?.id === editId) : null;

    return (
        <div className="pb-20">
            <h1 className="text-4xl font-black mb-8 px-1 text-black">VOUCHER CODES</h1>

            {/* CREATE / EDIT FORM */}
            <div className="bg-white p-8 border border-gray-200 shadow-sm mb-12 max-w-2xl ring-4 ring-black/5">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h2 className="text-xl font-bold uppercase tracking-tighter text-black">
                        {editingVoucher ? `Editing: ${editingVoucher?.code}` : 'Create New Voucher'}
                    </h2>
                    {editingVoucher && (
                        <a href="/admin/vouchers" className="text-[10px] font-bold bg-gray-100 px-2 py-1 hover:bg-black hover:text-white transition-colors text-black border border-gray-200">CANCEL EDIT</a>
                    )}
                </div>

                <form action={async (fd) => {
                    'use server';
                    try {
                        const { createVoucher, updateVoucher } = await import('./actions');
                        const id = fd.get('id') as string;
                        if (id) {
                            await updateVoucher(id, fd);
                        } else {
                            await createVoucher(fd);
                        }
                    } catch (e: unknown) {
                        console.error("[ADMIN] Form Action Error:", e);
                        throw e;
                    }
                }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold uppercase mb-2 text-black">Code</label>
                            <input
                                name="code"
                                required
                                defaultValue={editingVoucher?.code || ''}
                                placeholder="SUMMER2025"
                                className="w-full bg-gray-50 border p-3 font-mono text-sm uppercase text-black focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold uppercase mb-2 text-black">Type</label>
                            <select
                                name="type"
                                defaultValue={editingVoucher?.type || 'PERCENT'}
                                className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                            >
                                <option value="PERCENT">Percentage (%) Off</option>
                                <option value="FIXED">Fixed Amount (£) Off</option>
                                <option value="FIXED_PRICE">Set Item Price to (£)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2 text-black">Value (£ or %)</label>
                            <input
                                name="value"
                                type="number"
                                step="0.01"
                                required
                                defaultValue={editingVoucher ? (editingVoucher.type === 'PERCENT' ? (editingVoucher.discount_percent ?? '') : (editingVoucher.discount_amount ?? '')) : ''}
                                placeholder="10"
                                className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2 text-black">Min Spend (£)</label>
                            <input
                                name="min_spend"
                                type="number"
                                step="0.01"
                                defaultValue={editingVoucher?.min_spend || ''}
                                placeholder="0"
                                className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                            />
                        </div>
                    </div>

                    {/* Advanced Rules */}
                    <div className="border-t border-dashed pt-4 border-gray-200">
                        <h3 className="text-xs font-bold uppercase mb-4 text-gray-500">Advanced Rules</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2 text-black">Applies to Products</label>
                                <div className="border border-gray-200 bg-gray-50 p-4 max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {safeProducts.map((p) => p && (
                                        <div key={p?.id || Math.random().toString()} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="product_ids"
                                                value={p?.slug || ''}
                                                defaultChecked={editingVoucher?.product_ids?.includes(p?.slug || '')}
                                                id={`prod-${p?.id}`}
                                                className="w-4 h-4 accent-black"
                                            />
                                            <label htmlFor={`prod-${p?.id}`} className="text-xs font-mono truncate cursor-pointer hover:text-black text-gray-600 select-none">
                                                {p?.model} <span className="text-gray-400 opacity-50">({p?.category})</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Select none to apply to ALL products.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2 text-black">Max Qty (Per Cart)</label>
                                    <input
                                        name="max_usage_per_cart"
                                        type="number"
                                        defaultValue={editingVoucher?.max_usage_per_cart || ''}
                                        placeholder="Unlimited"
                                        className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2 text-black">Global Usage Limit</label>
                                    <input
                                        name="max_global_uses"
                                        type="number"
                                        defaultValue={editingVoucher?.max_global_uses || ''}
                                        placeholder="Unlimited"
                                        className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2 text-black">Start Date</label>
                                    <input
                                        name="start_date"
                                        type="datetime-local"
                                        defaultValue={editingVoucher?.start_date ? new Date(editingVoucher.start_date).toISOString().slice(0, 16) : ''}
                                        className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2 text-black">Expiry Date</label>
                                    <input
                                        name="expiry_date"
                                        type="datetime-local"
                                        defaultValue={editingVoucher?.expiry_date ? new Date(editingVoucher.expiry_date).toISOString().slice(0, 16) : ''}
                                        className="w-full bg-gray-50 border p-3 font-mono text-sm text-black"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    name="is_free_shipping"
                                    type="checkbox"
                                    defaultChecked={editingVoucher?.is_free_shipping}
                                    id="fs"
                                    className="w-4 h-4 accent-black"
                                />
                                <label htmlFor="fs" className="text-xs font-bold uppercase text-black cursor-pointer">Grant Free Shipping</label>
                            </div>
                        </div>
                    </div>

                    {/* Loyalty Protocols */}
                    <div className="border-t border-dashed pt-4 border-gray-200">
                        <h3 className="text-xs font-bold uppercase mb-4 text-gray-500">Loyalty Protocols</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    name="is_first_order_only"
                                    type="checkbox"
                                    defaultChecked={editingVoucher?.is_first_order_only}
                                    id="foo"
                                    className="w-4 h-4 accent-black"
                                />
                                <label htmlFor="foo" className="text-xs font-bold uppercase text-black cursor-pointer">Start Sequence (First Order Only)</label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2 text-black">Identity Lock (Allowed Emails)</label>
                                <textarea
                                    name="allowed_emails"
                                    defaultValue={Array.isArray(editingVoucher?.allowed_emails) ? editingVoucher.allowed_emails.join('\n') : ''}
                                    placeholder="user@example.com&#10;admin@zeuz.co.uk"
                                    className="w-full bg-gray-50 border p-3 font-mono text-xs text-black h-24"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Enter one email per line. Leave empty for public access.</p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-amber-500 hover:text-black transition-colors w-full">
                        {editingVoucher ? 'Update Voucher' : 'Create Voucher'}
                    </button>
                    {editingVoucher?.id && <input type="hidden" name="id" value={editingVoucher.id} />}
                </form>
            </div>

            {/* LIST */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden ring-1 ring-black/5">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-100 uppercase text-xs text-black border-b border-gray-200">
                        <tr>
                            <th className="p-4">Code / Type</th>
                            <th className="p-4">Value</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Usage</th>
                            <th className="p-4">Schedule / Rules</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                        {safeVouchers.map((v) => v && (
                            <tr key={v?.id || Math.random().toString()} className={cn(
                                "hover:bg-gray-50 transition-colors bg-white",
                                !v?.active && "opacity-50 grayscale",
                                editId === v?.id && "bg-amber-50"
                            )}>
                                <td className="p-4 border-b border-gray-50">
                                    <div className="font-bold text-lg text-black">{v?.code}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                        {v?.type?.replace('_', ' ')}
                                    </div>
                                </td>
                                <td className="p-4 border-b border-gray-50 text-black">
                                    <div className="font-bold">
                                        {v?.type === 'PERCENT' ? `${v?.discount_percent}%` : `£${v?.discount_amount}`}
                                    </div>
                                    {(v?.min_spend || 0) > 0 && <div className="text-[10px] text-gray-400 uppercase pt-1">Min: £{v?.min_spend}</div>}
                                </td>
                                <td className="p-4 border-b border-gray-50">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${v?.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {v?.active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-gray-50 text-black text-sm">
                                    <div className="font-bold">{v?.used_count || 0} / {v?.max_global_uses || '∞'}</div>
                                    <div className="text-[10px] text-gray-400 uppercase pt-1">Uses</div>
                                </td>
                                <td className="p-4 border-b border-gray-50">
                                    <div className="text-[10px] space-y-1">
                                        {v?.is_free_shipping && <div className="text-amber-600 font-bold uppercase">FREE SHIPPING</div>}
                                        {v?.product_ids && v?.product_ids.length > 0 && (
                                            <div className="text-blue-600 truncate max-w-[150px]" title={v?.product_ids.join(', ')}>
                                                {v?.product_ids.length} PRODUCT(S)
                                            </div>
                                        )}
                                        {(v?.max_usage_per_cart || 0) > 0 && <div className="text-gray-500 uppercase">MAX {v?.max_usage_per_cart} PER CART</div>}

                                        <div className="text-gray-400 pt-2 border-t border-gray-100">
                                            {v?.start_date ? new Date(v?.start_date).toLocaleDateString() : 'NOW'}
                                            {' -> '}
                                            {v?.expiry_date ? new Date(v?.expiry_date).toLocaleDateString() : 'EVER'}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-3 h-full items-center min-h-[80px] border-b border-gray-50">
                                    <div className="flex flex-col gap-1 items-end">
                                        <form action={async () => {
                                            'use server';
                                            try {
                                                const { toggleVoucher } = await import('./actions');
                                                await toggleVoucher(v?.id, !!v?.active);
                                            } catch (e) {
                                                console.error("[ADMIN] Toggle Error:", e);
                                            }
                                        }}>
                                            <button className="text-blue-600 hover:scale-105 transition-transform text-[10px] font-bold uppercase underline">
                                                {v?.active ? 'DISABLE' : 'ENABLE'}
                                            </button>
                                        </form>

                                        <form action={async () => {
                                            'use server';
                                            try {
                                                const { duplicateVoucher } = await import('./actions');
                                                await duplicateVoucher(v?.id);
                                            } catch (e) {
                                                console.error("[ADMIN] Duplicate Error:", e);
                                            }
                                        }}>
                                            <button className="text-amber-600 hover:scale-105 transition-transform text-[10px] font-bold uppercase underline">
                                                CLONE
                                            </button>
                                        </form>

                                        {v?.active ? (
                                            <span className="text-[10px] font-bold text-gray-300 uppercase cursor-not-allowed select-none">DELETE</span>
                                        ) : (
                                            <form action={async () => {
                                                'use server';
                                                try {
                                                    const { deleteVoucher } = await import('./actions');
                                                    await deleteVoucher(v?.id);
                                                } catch (e) {
                                                    console.error("[ADMIN] Delete Error:", e);
                                                }
                                            }}>
                                                <button className="text-red-500 hover:scale-105 transition-transform text-[10px] font-bold uppercase underline">
                                                    DELETE
                                                </button>
                                            </form>
                                        )}

                                        <a href={`/admin/vouchers?edit=${v?.id}`} className="text-black hover:scale-105 transition-transform text-[10px] font-bold uppercase underline">
                                            EDIT
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {safeVouchers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-400 italic bg-gray-50/50">
                                    SYSTEM_LOG: NO VOUCHER RECORDS FOUND...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
