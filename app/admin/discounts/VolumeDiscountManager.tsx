"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Save, RefreshCw } from 'lucide-react';

interface Tier {
    id?: string;
    min_quantity: number;
    discount_percent: number;
    label: string | null;
    active: boolean;
}

export function VolumeDiscountManager() {
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchTiers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('volume_discounts')
            .select('*')
            .order('min_quantity', { ascending: true });

        if (data) setTiers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTiers();
    }, []);

    const handleSave = async (tier: Tier) => {
        setSaving(true);
        if (tier.id) {
            await supabase.from('volume_discounts').update(tier).eq('id', tier.id);
        } else {
            await supabase.from('volume_discounts').insert(tier);
        }
        await fetchTiers();
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tier?')) return;
        setSaving(true);
        await supabase.from('volume_discounts').delete().eq('id', id);
        await fetchTiers();
        setSaving(false);
    };

    const [newTier, setNewTier] = useState<Tier>({ min_quantity: 0, discount_percent: 0, label: '', active: true });

    return (
        <div className="p-6 border border-[#333] bg-[#0A0A0A] max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4">
                <h2 className="text-xl font-mono text-white font-bold tracking-tight">VOLUME DISCOUNT MATRIX</h2>
                <button onClick={fetchTiers} className="p-2 hover:bg-[#222] text-white rounded-full transition-colors">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 text-xs font-mono text-[#666] uppercase tracking-wider px-2">
                    <div className="col-span-2">Min Qty</div>
                    <div className="col-span-2">Discount %</div>
                    <div className="col-span-4">Label (Optional)</div>
                    <div className="col-span-2 text-center">Active</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* List */}
                {tiers.map((tier) => (
                    <div key={tier.id} className="grid grid-cols-12 gap-4 items-center bg-[#111] p-3 border border-[#222] hover:border-[#444] transition-colors group">
                        <div className="col-span-2">
                            <input
                                type="number"
                                value={tier.min_quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTiers(tiers.map(t => t.id === tier.id ? { ...t, min_quantity: val } : t));
                                }}
                                className="w-full bg-transparent border-b border-[#333] text-white font-mono text-sm focus:border-white outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                value={tier.discount_percent}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setTiers(tiers.map(t => t.id === tier.id ? { ...t, discount_percent: val } : t));
                                }}
                                className="w-full bg-transparent border-b border-[#333] text-[#D946EF] font-mono text-sm focus:border-[#D946EF] outline-none"
                            />
                        </div>
                        <div className="col-span-4">
                            <input
                                type="text"
                                value={tier.label || ''}
                                onChange={(e) => {
                                    setTiers(tiers.map(t => t.id === tier.id ? { ...t, label: e.target.value } : t));
                                }}
                                className="w-full bg-transparent border-b border-[#333] text-white font-mono text-sm focus:border-white outline-none"
                            />
                        </div>
                        <div className="col-span-2 flex justify-center">
                            <button
                                onClick={() => {
                                    const updated = { ...tier, active: !tier.active };
                                    setTiers(tiers.map(t => t.id === tier.id ? updated : t));
                                    handleSave(updated); // Auto-save toggle
                                }}
                                className={`w-8 h-4 rounded-full relative transition-colors ${tier.active ? 'bg-[#00FF99]' : 'bg-[#333]'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-black rounded-full transition-transform ${tier.active ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleSave(tier)} disabled={saving} className="p-1 text-[#00FF99] hover:bg-[#00FF99]/10 rounded"><Save size={14} /></button>
                            <button onClick={() => handleDelete(tier.id!)} disabled={saving} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}

                {/* New Tier Form */}
                <div className="grid grid-cols-12 gap-4 items-center bg-[#111] p-3 border border-[#222] border-dashed mt-4 opacity-50 hover:opacity-100 transition-opacity">
                    <div className="col-span-2">
                        <input
                            type="number"
                            placeholder="Min Qty"
                            value={newTier.min_quantity || ''}
                            onChange={(e) => setNewTier({ ...newTier, min_quantity: parseInt(e.target.value) })}
                            className="w-full bg-transparent border-b border-[#333] text-white font-mono text-sm focus:border-white outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <input
                            type="number"
                            placeholder="%"
                            value={newTier.discount_percent || ''}
                            onChange={(e) => setNewTier({ ...newTier, discount_percent: parseFloat(e.target.value) })}
                            className="w-full bg-transparent border-b border-[#333] text-[#D946EF] font-mono text-sm focus:border-[#D946EF] outline-none"
                        />
                    </div>
                    <div className="col-span-4">
                        <input
                            type="text"
                            placeholder="Label (e.g. Bulk Deal)"
                            value={newTier.label || ''}
                            onChange={(e) => setNewTier({ ...newTier, label: e.target.value })}
                            className="w-full bg-transparent border-b border-[#333] text-white font-mono text-sm focus:border-white outline-none"
                        />
                    </div>
                    <div className="col-span-4 text-right">
                        <button
                            onClick={async () => {
                                await handleSave(newTier);
                                setNewTier({ min_quantity: 0, discount_percent: 0, label: '', active: true });
                            }}
                            disabled={!newTier.min_quantity || !newTier.discount_percent || saving}
                            className="bg-white text-black px-4 py-1.5 text-xs font-bold font-mono uppercase hover:bg-[#D946EF] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center gap-2"><Plus size={14} /> ADD TIER</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
