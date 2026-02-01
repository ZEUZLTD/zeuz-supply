
import fs from 'fs';
import path from 'path';

export default function StrategyPage() {
    const strategyPath = path.join(process.cwd(), 'STRATEGY.md');
    let content = '';

    try {
        content = fs.readFileSync(strategyPath, 'utf-8');
    } catch (error) {
        content = 'Error loading Strategy document. Please ensure STRATEGY.md exists in the project root.';
        console.error('Failed to read STRATEGY.md', error);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto text-white">
            <header className="mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-3xl font-black tracking-tighter mb-2">STRATEGY <span className="text-gray-500">{"// ENGINE"}</span></h1>
                <p className="text-gray-400 font-mono text-sm max-w-2xl">
                    Living documentation of the ZEUZ business model, pricing strategy, and competitive analysis.
                    This document drives the decision-making logic for autonomous agents.
                </p>
            </header>

            <div className="bg-[#0A0A0A] border border-gray-800 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-300">
                {content}
            </div>
        </div>
    );
}
