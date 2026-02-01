'use client';

import { useState } from 'react';
import { InventoryItem } from '@/lib/types';
import { upsertProduct } from '@/app/admin/products/product-actions';

import Image from 'next/image';
import ImageUploader from './image-uploader';
import GraphDataModal from '@/app/admin/components/GraphDataModal';

export default function ProductForm({ product }: { product?: InventoryItem | null }) {
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>(product?.images || []);
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
    const [selectedBatchForGraph, setSelectedBatchForGraph] = useState<{ id: string, code: string, hasData: boolean } | null>(null);

    // ... existing submit logic ...

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // Append images manually
        formData.delete('images');
        images.forEach(img => formData.append('images', img));

        if (!product) {
            formData.append('is_new', 'true');
        }

        try {
            await upsertProduct(formData);
            // Redirect or success handling is done by server action (revalidate + path change?)
            // Actually server action revalidates but doesn't redirect the browser URL if we are on the same page.
            // But if we are creating new, we might want to go to list or edit page.
            // Let's assume server action revalidates and we might want to redirect manually if needed, 
            // but for now let's see. The action does NOT redirect in my code above, just revalidates.
            // So we should redirect programmatically or update the UI.
            // Let's rely on the router to go back to list for now.
            window.location.href = '/admin/products';
        } catch (err) {
            console.error(err);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    // Helper for manual handling removed in favor of ImageUploader
    // const addImage = ... 


    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="bg-white p-8 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6 border-b pb-2">Basic Info</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Model Name</label>
                        <input name="model" required defaultValue={product?.model} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Slug (URL)</label>
                        <input name="slug" required defaultValue={product?.slug || ''} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold uppercase mb-2">Pitch / Short Desc</label>
                        <textarea name="pitch" rows={3} defaultValue={product?.pitch} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Category</label>
                        <select name="category" defaultValue={product?.category || 'POWER'} className="w-full bg-gray-50 border p-3 font-mono text-sm">
                            <option value="POWER">POWER</option>
                            <option value="ENERGY">ENERGY</option>
                            <option value="PROTOTYPE">PROTOTYPE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Tag (e.g. HIGH DRAIN)</label>
                        <input name="tag" defaultValue={product?.tag} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Price (£)</label>
                        <input name="price" type="number" step="0.01" defaultValue={product?.price || ''} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Priority (Sort Order)</label>
                        <input name="priority" type="number" defaultValue={product?.priority || 99} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6 border-b pb-2">Technical Specs</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Spec Summary (e.g. 45A / 4000mAh)</label>
                        <input name="spec" defaultValue={product?.spec} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Nominal Voltage (V)</label>
                        <input name="nominal_voltage_v" type="number" step="0.1" defaultValue={product?.nominal_voltage_v} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Charge Voltage (V)</label>
                        <input name="charge_voltage_v" type="number" step="0.1" defaultValue={product?.charge_voltage_v} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Discharge Cutoff (V)</label>
                        <input name="discharge_cutoff_v" type="number" step="0.1" defaultValue={product?.discharge_cutoff_v} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Standard Charge (A)</label>
                        <input name="standard_charge_a" type="number" step="0.1" defaultValue={product?.standard_charge_a} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Max Discharge (A)</label>
                        <input name="max_discharge_a" type="number" step="0.1" defaultValue={product?.max_discharge_a} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">Weight (g)</label>
                        <input name="weight_g" type="number" step="0.1" defaultValue={product?.weight_g} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2">AC Impedance (mΩ)</label>
                        <input name="ac_impedance_mohm" type="number" step="0.1" defaultValue={product?.ac_impedance_mohm} className="w-full bg-gray-50 border p-3 font-mono text-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-2 gap-4">
                    <h2 className="text-xl font-bold">Images</h2>
                    <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-[10px] font-bold uppercase text-gray-400 mr-2">Reference Order:</span>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div key={num} className="relative w-8 h-8 border border-gray-200 bg-white" title={`Ref Image ${num}`}>
                                <Image
                                    src={`/images/defaults/${num}.png`}
                                    alt={`Ref ${num}`}
                                    fill
                                    className="object-contain p-1"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-black text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full font-mono">{num}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <ImageUploader
                    value={images}
                    onChange={setImages}
                    slug={product?.slug || 'temp'}
                />
            </div>

            {product && (
                <div className="bg-white p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 border-b pb-2 flex justify-between items-center">
                        <span>Batch Management</span>
                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
                            Total Stock: {product.batches?.filter(b => b.status === 'LIVE').reduce((acc, b) => acc + (b.stock_quantity || 0), 0) || 0}
                        </span>
                    </h2>
                    <div className="mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 uppercase text-xs">
                                <tr>
                                    <th className="p-3">Batch Code</th>
                                    <th className="p-3">Stock</th>
                                    <th className="p-3">Details</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y font-mono">
                                {product.batches?.map(batch => (
                                    <tr key={batch.id} className={batch.status === 'ARCHIVED' ? 'opacity-50 bg-gray-50' : ''}>
                                        <td className="p-3">{batch.batch_code}</td>
                                        <td className="p-3 font-bold">
                                            {editingBatchId === batch.id ? (
                                                <input
                                                    type="number"
                                                    defaultValue={batch.stock_quantity}
                                                    className="w-20 border p-1"
                                                    id={`stock-${batch.id}`}
                                                />
                                            ) : (
                                                batch.stock_quantity
                                            )}
                                        </td>
                                        <td className="p-3 text-xs text-gray-600">
                                            {editingBatchId === batch.id ? (
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        id={`ref-${batch.id}`}
                                                        defaultValue={batch.supplier_reference || ''}
                                                        placeholder="Supplier Ref"
                                                        className="border p-1 w-32"
                                                    />
                                                    <input
                                                        id={`date-${batch.id}`}
                                                        type="date"
                                                        defaultValue={batch.received_date ? new Date(batch.received_date).toISOString().split('T')[0] : ''}
                                                        className="border p-1 w-32"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {batch.supplier_reference && <div>Ref: {batch.supplier_reference}</div>}
                                                    {batch.received_date && <div>Date: {new Date(batch.received_date).toLocaleDateString('en-GB')}</div>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-xs">{batch.status}</td>
                                        <td className="p-3 text-right space-x-2">
                                            {editingBatchId === batch.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const inputStock = document.getElementById(`stock-${batch.id}`) as HTMLInputElement;
                                                            const inputRef = document.getElementById(`ref-${batch.id}`) as HTMLInputElement;
                                                            const inputDate = document.getElementById(`date-${batch.id}`) as HTMLInputElement;

                                                            const val = parseInt(inputStock.value);
                                                            if (isNaN(val) || val < 0) return alert('Invalid stock');

                                                            setLoading(true);
                                                            try {
                                                                await import('../product-actions').then(mod => mod.updateBatch(batch.id, {
                                                                    stock_quantity: val,
                                                                    supplier_reference: inputRef.value,
                                                                    received_date: inputDate.value || undefined
                                                                }));
                                                                setEditingBatchId(null);
                                                                window.location.reload();
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert('Failed to update stock');
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }}
                                                        className="text-green-600 hover:underline text-xs font-bold"
                                                    >
                                                        SAVE
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingBatchId(null)}
                                                        className="text-gray-500 hover:underline text-xs"
                                                    >
                                                        CANCEL
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {batch.status === 'LIVE' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedBatchForGraph({ id: batch.id, code: batch.batch_code, hasData: !!batch.graph_data })}
                                                                className="text-purple-600 hover:underline text-xs mr-2 font-bold"
                                                            >
                                                                GRAPH_CSV
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingBatchId(batch.id)}
                                                                className="text-blue-600 hover:underline text-xs mr-2"
                                                            >
                                                                EDIT
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    if (!confirm('Archive this batch?')) return;
                                                                    await import('../product-actions').then(mod => mod.archiveBatch(batch.id));
                                                                    window.location.reload();
                                                                }}
                                                                className="text-red-500 hover:underline text-xs"
                                                            >
                                                                ARCHIVE
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!product.batches || product.batches.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-gray-400 italic">No batches found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 p-6 border border-dashed border-gray-300">
                        <h3 className="font-bold text-sm uppercase mb-4">Add New Batch</h3>
                        <div className="flex gap-4 items-end flex-wrap">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Stock Quantity</label>
                                <input type="number" id="newBatchStock" className="w-32 bg-white border p-2 font-mono" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Supplier Ref</label>
                                <input type="text" id="newBatchRef" className="w-32 bg-white border p-2 font-mono" placeholder="Optional" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Date Received</label>
                                <input type="date" id="newBatchDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-32 bg-white border p-2 font-mono" />
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    const input = document.getElementById('newBatchStock') as HTMLInputElement;
                                    const refInput = document.getElementById('newBatchRef') as HTMLInputElement;
                                    const dateInput = document.getElementById('newBatchDate') as HTMLInputElement;

                                    const val = parseInt(input.value);
                                    if (!val || val < 0) return alert('Invalid stock');

                                    setLoading(true);
                                    try {
                                        await import('../product-actions').then(mod => mod.addBatch(product.slug!, val, refInput.value, dateInput.value));
                                        window.location.reload();
                                    } catch (e) {
                                        console.error(e);
                                        alert('Failed to add batch');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800"
                            >
                                Add Batch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-end z-50">
                <button type="submit" disabled={loading} className="bg-green-500 text-white px-8 py-3 font-bold uppercase hover:brightness-110 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            {selectedBatchForGraph && (
                <GraphDataModal
                    batchId={selectedBatchForGraph.id}
                    batchCode={selectedBatchForGraph.code}
                    hasGraphData={selectedBatchForGraph.hasData}
                    onClose={() => setSelectedBatchForGraph(null)}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </form>
    );
}
