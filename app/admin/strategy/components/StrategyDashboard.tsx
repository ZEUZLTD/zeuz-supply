
'use client';

import { useState } from 'react';
import PricingCalculator from './PricingCalculator';
import CompetitorMatrix from './CompetitorMatrix';

interface StrategyDashboardProps {
    documentationContent: string;
}

export default function StrategyDashboard({ documentationContent }: StrategyDashboardProps) {
    const [activeTab, setActiveTab] = useState<'calculator' | 'matrix' | 'docs'>('calculator');

    return (
        <div className="space-y-6">
            {/* TABS */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('calculator')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'calculator'
                            ? 'border-b-2 border-amber-500 text-black'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Pricing Calculator
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'matrix'
                            ? 'border-b-2 border-amber-500 text-black'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Competitor Matrix
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'docs'
                            ? 'border-b-2 border-amber-500 text-black'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Strategy Text
                </button>
            </div>

            {/* CONTENT */}
            <div className="min-h-[600px]">
                {activeTab === 'calculator' && (
                    <PricingCalculator />
                )}

                {activeTab === 'matrix' && (
                    <CompetitorMatrix />
                )}

                {activeTab === 'docs' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-700 shadow-sm">
                        {documentationContent}
                    </div>
                )}
            </div>
        </div>
    );
}
