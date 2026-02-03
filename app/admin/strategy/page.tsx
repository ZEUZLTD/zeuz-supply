
import fs from 'fs';
import path from 'path';
import StrategyDashboard from './components/StrategyDashboard';

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
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-black">STRATEGY <span className="text-gray-400">// ENGINE</span></h1>
                <p className="text-gray-500 text-sm max-w-2xl mt-2">
                    Interactive Pricing Engine & Competitive Modeling.
                </p>
            </header>

            <StrategyDashboard documentationContent={content} />
        </div>
    );
}
