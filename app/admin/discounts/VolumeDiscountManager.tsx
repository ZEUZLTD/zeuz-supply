"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Save, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tier {
    id?: string;
    min_quantity: number;
    discount_percent: number;
    label: string | null;
    active: boolean;
}

export function VolumeDiscountManager() {
    // State
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [originalTiers, setOriginalTiers] = useState<Tier[]>([]); // For dirty check baseline
    const [deletedIds, setDeletedIds] = useState<string[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // New Tier Input State
    const [newTier, setNewTier] = useState<Tier>({ min_quantity: 0, discount_percent: 0, label: '', active: true });

    const fetchTiers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('volume_discounts')
            .select('*')
            .order('min_quantity', { ascending: true });

        if (data) {
            setTiers(data);
            setOriginalTiers(JSON.parse(JSON.stringify(data))); // Deep copy
            setDeletedIds([]);
            setIsDirty(false);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTiers();
    }, []);

    // Dirty Check Logic
    const markDirty = () => {
        setIsDirty(true);
        setShowSuccess(false);
    }

    const handleUpdate = (id: string | undefined, updates: Partial<Tier>) => {
        setTiers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        markDirty();
    };

    const handleAdd = () => {
        // Create a temporary ID for keying (negative or random string)
        const tempId = `temp_${Date.now()}`;
        const tierToAdd = { ...newTier, id: tempId };
        setTiers([...tiers, tierToAdd]);
        setNewTier({ min_quantity: 0, discount_percent: 0, label: '', active: true }); // Reset form
        markDirty();
    };

    const handleDelete = (id: string | undefined) => {
        if (!id) return;

        if (id.startsWith('temp_')) {
            // Just remove from state if it's new
            setTiers(prev => prev.filter(t => t.id !== id));
        } else {
            // Mark for deletion
            setDeletedIds(prev => [...prev, id]);
            setTiers(prev => prev.filter(t => t.id !== id));
        }
        markDirty();
    };

    const saveAll = async () => {
        setSaving(true);
        setShowSuccess(false);

        // 1. Process Deletions
        if (deletedIds.length > 0) {
            await supabase.from('volume_discounts').delete().in('id', deletedIds);
        }

        // 2. Process Upserts (Updates + New)
        // Separate clean generic objects from internal state
        const upsertPayload = tiers.map(t => {
            const { id, ...rest } = t;
            // If temp id, remove it to let DB generate UUID
            if (id && id.startsWith('temp_')) {
                return rest;
            }
            return t; // Existing ID passes through
        });

        if (upsertPayload.length > 0) {
            const { error } = await supabase.from('volume_discounts').upsert(upsertPayload);
            if (error) {
                console.error("Save Error", error);
                alert("Failed to save changes. Check console.");
                setSaving(false);
                return;
            }
        }

        // 3. Reset
        await fetchTiers(); // Re-fetch to get real IDs and clean state
        setSaving(false);
        setIsDirty(false);
        setShowSuccess(true);

        // Hide success message after 3s
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const discardChanges = () => {
        if (confirm("Discard all unsaved changes?")) {
            setTiers(JSON.parse(JSON.stringify(originalTiers)));
            setDeletedIds([]);
            setIsDirty(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 shadow-sm max-w-4xl mx-auto relative min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-black tracking-tight">VOLUME DISCOUNT MATRIX</h2>
                    {loading && <RefreshCw size={16} className="animate-spin text-gray-400" />}
                </div>
                <div className="text-xs font-mono text-gray-400">
                    {tiers.length} ACTIVE RULES
                </div>
            </div>

            <div className="p-6 space-y-4 flex-1">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4">
                    <div className="col-span-2">Min Qty</div>
                    <div className="col-span-2">Discount %</div>
                    <div className="col-span-4">Label (Optional)</div>
                    <div className="col-span-2 text-center">Active</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* List */}
                <div className="space-y-2">
                    {tiers.map((tier) => (
                        <div key={tier.id} className="grid grid-cols-2 md:grid-cols-12 gap-4 items-center bg-gray-50 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors group">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block md:hidden text-[10px] uppercase font-bold text-gray-400 mb-1">Min Qty</label>
                                <input
                                    type="number"
                                    value={tier.min_quantity}
                                    onChange={(e) => handleUpdate(tier.id, { min_quantity: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white border border-gray-200 px-2 py-1 text-black font-mono text-sm rounded focus:border-black outline-none"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 relative">
                                <label className="block md:hidden text-[10px] uppercase font-bold text-gray-400 mb-1">Discount %</label>
                                <input
                                    type="number"
                                    value={tier.discount_percent}
                                    onChange={(e) => handleUpdate(tier.id, { discount_percent: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white border border-gray-200 px-2 py-1 text-amber-600 font-bold font-mono text-sm rounded focus:border-black outline-none"
                                />
                                <span className="absolute right-3 top-7 md:top-1.5 text-xs text-gray-400 font-mono">%</span>
                            </div>
                            <div className="col-span-2 md:col-span-4">
                                <label className="block md:hidden text-[10px] uppercase font-bold text-gray-400 mb-1">Label</label>
                                <input
                                    type="text"
                                    value={tier.label || ''}
                                    onChange={(e) => handleUpdate(tier.id, { label: e.target.value })}
                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black px-2 py-1 text-gray-700 font-mono text-sm outline-none transition-colors"
                                    placeholder="Add Label..."
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center items-center gap-2 md:gap-0">
                                <span className="block md:hidden text-[10px] uppercase font-bold text-gray-400">Active</span>
                                <button
                                    onClick={() => handleUpdate(tier.id, { active: !tier.active })}
                                    className={`w-10 h-6 rounded-full relative transition-colors ${tier.active ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${tier.active ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 md:opacity-50 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(tier.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}

                    {tiers.length === 0 && !loading && (
                        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                            No active discount rules. Add one below.
                        </div>
                    )}
                </div>

                {/* New Tier Form */}
                <div className="grid grid-cols-2 md:grid-cols-12 gap-4 items-center bg-white p-4 border border-dashed border-gray-300 rounded-lg mt-8 opacity-75 hover:opacity-100 transition-all">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block md:hidden text-[10px] uppercase font-bold text-gray-400 mb-1">New Min Qty</label>
                        <input
                            type="number"
                            placeholder="Qty"
                            value={newTier.min_quantity || ''}
                            onChange={(e) => setNewTier({ ...newTier, min_quantity: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-200 px-2 py-1 text-black font-mono text-sm rounded focus:border-black outline-none"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block md:hidden text-[10px] uppercase font-bold text-gray-400 mb-1">New Discount %</label>
                        <input
                            type="number"
                            placeholder="%"
                            value={newTier.discount_percent || ''}
                            onChange={(e) => setNewTier({ ...newTier, discount_percent: parseFloat(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-200 px-2 py-1 text-black font-mono text-sm rounded focus:border-black outline-none"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-4">
                        <label className="block md:hidden text-[10px] uppercase font-bold text-gray-400 mb-1">New Label</label>
                        <input
                            type="text"
                            placeholder="Label (e.g. Wholesale)"
                            value={newTier.label || ''}
                            onChange={(e) => setNewTier({ ...newTier, label: e.target.value })}
                            className="w-full bg-transparent border-b border-gray-200 text-gray-600 font-mono text-sm focus:border-black outline-none px-2"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-4 text-right mt-2 md:mt-0">
                        <button
                            onClick={handleAdd}
                            disabled={!newTier.min_quantity || !newTier.discount_percent}
                            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full md:w-auto flex justify-center md:inline-flex items-center gap-2"
                        >
                            <Plus size={14} /> Add Queue
                        </button>
                    </div>
                </div>
            </div>

            {/* STICKY SAVE FOOTER */}
            <div className={cn(
                "sticky bottom-0 bg-white border-t border-gray-200 p-4 transition-all duration-300 flex justify-between items-center shadow-lg z-10",
                (isDirty || showSuccess) ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none absolute w-full"
            )}>
                <div className="flex items-center gap-3">
                    {showSuccess ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                            <Check size={16} /> CHANGES SAVED
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full">
                            <AlertCircle size={16} /> UNSAVED CHANGES
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={discardChanges}
                        disabled={saving || showSuccess}
                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase"
                    >
                        Discard
                    </button>
                    <button
                        onClick={saveAll}
                        disabled={saving || showSuccess}
                        className="bg-black text-white px-6 py-2 text-xs font-bold uppercase rounded hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:loading shadow-md hover:shadow-lg"
                    >
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                </div>
            </div>
        </div>
    );
}
