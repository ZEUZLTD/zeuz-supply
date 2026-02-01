'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getStartEndDates, adjustDate, TimeframeMode } from '@/lib/date-utils';
import { useState } from 'react';

export default function DashboardControls() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL State
    const mode = (searchParams.get('mode') as TimeframeMode) || 'month';
    const dateParam = searchParams.get('date');
    const refDate = dateParam ? new Date(dateParam) : new Date();

    // Local State for Custom Range
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Display Logic
    const { label } = getStartEndDates(mode, refDate);

    const updateParams = (newMode: string, newDate?: Date) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('mode', newMode);
        if (newDate) {
            params.set('date', newDate.toISOString());
        } else {
            // If switching modes, simple reset to now or keep date?
            // Resetting to now is safer for UX usually
            if (newMode !== 'custom') params.delete('date');
        }

        // Clear custom params if not custom
        if (newMode !== 'custom') {
            params.delete('from');
            params.delete('to');
        }

        router.push(`?${params.toString()}`);
    };

    const handlePrev = () => {
        const newDate = adjustDate(refDate, mode, 'prev');
        updateParams(mode, newDate);
    };

    const handleNext = () => {
        const newDate = adjustDate(refDate, mode, 'next');
        updateParams(mode, newDate);
    };

    const handleCustomApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('mode', 'custom');
        params.set('from', customStart);
        params.set('to', customEnd);
        params.delete('date');
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            {/* Custom Date Inputs */}
            {mode === 'custom' && (
                <div className="flex items-center gap-2 bg-white p-1 border border-gray-200">
                    <input
                        type="date"
                        className="text-xs border-none focus:ring-0 p-1"
                        onChange={(e) => setCustomStart(e.target.value)}
                        value={customStart}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        className="text-xs border-none focus:ring-0 p-1"
                        onChange={(e) => setCustomEnd(e.target.value)}
                        value={customEnd}
                    />
                    <button
                        onClick={handleCustomApply}
                        className="bg-amber-500 text-white p-1 text-xs hover:bg-amber-600"
                    >
                        GO
                    </button>
                </div>
            )}

            <div className="flex items-center bg-white border border-gray-200 shadow-sm">
                {/* Navigation Arrows */}
                {mode !== 'all' && mode !== 'custom' && (
                    <button onClick={handlePrev} className="p-2 hover:bg-gray-50 border-r border-gray-100 text-gray-500">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}

                {/* Label Display */}
                <div className="px-4 py-2 min-w-[140px] text-center">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
                        {mode === 'financial_year' ? 'Financial Year' : mode}
                    </div>
                    <div className="text-xs font-bold whitespace-nowrap">
                        {mode === 'custom' ? (searchParams.get('from') ? `${searchParams.get('from')} - ${searchParams.get('to')}` : 'Select Range') : label}
                    </div>
                </div>

                {/* Navigation Arrows */}
                {mode !== 'all' && mode !== 'custom' && (
                    <button onClick={handleNext} className="p-2 hover:bg-gray-50 border-l border-gray-100 text-gray-500">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* Mode Selector */}
                <div className="border-l border-gray-200 p-1">
                    <select
                        value={mode}
                        onChange={(e) => updateParams(e.target.value)}
                        className="text-xs border-none bg-transparent font-bold uppercase text-gray-500 cursor-pointer focus:ring-0"
                    >
                        <option value="today">Today</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="financial_year">Financial Year</option>
                        <option value="all">All Time</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
