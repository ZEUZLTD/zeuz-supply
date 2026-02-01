"use client";

import { useMemo, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { InventoryItem, SectionType } from "@/lib/types";
import { DISCHARGE_DATA } from "@/data/discharge_curves"; // Fallback Import

interface DischargeGraphProps {
    type: SectionType;
    products: InventoryItem[];
}

interface DischargeCurve {
    capacity: number; // Ah
    voltage: number;  // V
}

type CellCurves = {
    [current: string]: DischargeCurve[];
};

type SectionGraphs = {
    cells: string[];
    currents: number[];
    data: {
        [cellName: string]: CellCurves;
    };
};

export const DischargeGraph = ({ type, products }: DischargeGraphProps) => {
    const hoveredProduct = useUIStore((state) => state.hoveredProduct);

    // Dynamically build graph data from products
    const graphData: SectionGraphs | null = useMemo(() => {
        const relevantProducts = products.filter(p => p.graph_data);

        // Fallback to legacy data if DB data is missing
        if (relevantProducts.length === 0) {
            return DISCHARGE_DATA[type] ? DISCHARGE_DATA[type] as unknown as SectionGraphs : null;
        }

        const cells = relevantProducts.map(p => p.model);
        // Find the union of all currents available across these products
        const allCurrents = new Set<string>();
        relevantProducts.forEach(p => {
            if (p.graph_data) {
                Object.keys(p.graph_data).forEach(k => allCurrents.add(k));
            }
        });

        // Convert "10A" -> 10 for sorting
        const currents = Array.from(allCurrents)
            .map(c => parseFloat(c.replace('A', '')))
            .sort((a, b) => a - b);


        const dataMap: { [cellName: string]: CellCurves } = {};
        relevantProducts.forEach(p => {
            if (p.graph_data) {
                dataMap[p.model] = p.graph_data as unknown as CellCurves;
            }
        });

        return {
            cells,
            currents,
            data: dataMap
        };

    }, [products]);

    // Defaults
    // Power: 40A
    // Energy: 10A
    const defaultCurrent = type === 'POWER' ? 40 : 10;
    // Ensure default exists in available currents, else pick middle
    const initialCurrent = graphData && graphData.currents.includes(defaultCurrent)
        ? defaultCurrent
        : (graphData && graphData.currents.length > 0 ? graphData.currents[1] || graphData.currents[0] : 10);

    const [current, setCurrent] = useState(initialCurrent);
    // Toggles for visible cells (Default all true)
    const [hiddenCells, setHiddenCells] = useState<Record<string, boolean>>({});
    const [showRaw, setShowRaw] = useState(false);

    if (!graphData) return (
        <div className="flex items-center justify-center w-full h-full text-zinc-400 font-mono-spec text-xs">
            NO DISCHARGE DATA AVAILABLE
        </div>
    );

    const allCells = graphData.cells;

    const isVisible = (cell: string) => !hiddenCells[cell];

    const toggleCell = (cell: string) => {
        setHiddenCells(prev => ({ ...prev, [cell]: !prev[cell] }));
    };

    // Helper to match hovered product to graph key
    const isHovered = (cellName: string) => {
        if (!hoveredProduct) return false;
        const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const nCell = normalize(cellName);
        const nProduct = normalize(hoveredProduct);
        return nCell.includes(nProduct) || nProduct.includes(nCell);
    };

    // Sort cells by DB Priority
    const getPriority = (model: string) => {
        const p = products.find(p => p.model === model);
        return p ? p.priority : 99;
    };

    const renderCells = [...allCells].sort((a, b) => {
        // Ascending order based on priority key (1 first)
        return getPriority(a) - getPriority(b);
    });

    const getColor = (model: string) => {
        if (model.includes("TENPOWER")) return type === 'POWER' ? "#FF3300" : "#00FF99";
        if (model.includes("SAMSUNG")) return "#3b82f6";
        if (model.includes("MOLICEL")) return "#a855f7";
        if (model.includes("LG")) return "#ec4899";
        if (model.includes("VAPCELL")) return "#eab308";
        return "#ffffff";
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, label }: { active?: boolean; label?: string | number }) => {
        if (!active) return null;
        const currentCapacity = Number(label);

        return (
            <div className="bg-white/95 backdrop-blur-sm border border-black/10 p-3 text-xs shadow-xl min-w-[150px]">
                <div className="font-bold mb-2 border-b border-black/5 pb-1">
                    CAPACITY: {currentCapacity.toFixed(2)} Ah
                </div>
                <div className="space-y-1">
                    {renderCells.map(cell => {
                        if (!isVisible(cell)) return null;

                        const curve = graphData.data[cell][`${current}A`];
                        if (!curve) return null;

                        // Find closest point (assuming sorted capacity)
                        // Simple find for now
                        const point = curve.find((p) => p.capacity >= currentCapacity);

                        // Fallback logic
                        const voltage = point ? point.voltage : (currentCapacity > curve[curve.length - 1].capacity ? 0 : curve[0].voltage);

                        if (voltage < 2.5) return null;

                        return (
                            <div key={cell} className={cn("flex justify-between items-center gap-4", isHovered(cell) && "font-bold bg-black/5 rounded px-1 -mx-1")}>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColor(cell) }} />
                                    <span style={{ color: getColor(cell) }}>{cell}</span>
                                </div>
                                <span className="font-mono-spec">{voltage.toFixed(2)}V</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col font-mono-spec">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                    {/* Current Toggles */}
                    {graphData.currents.map(amp => (
                        <button
                            key={amp}
                            onClick={() => setCurrent(amp)}
                            className={cn(
                                "px-3 py-1 text-xs font-bold border transition-colors",
                                current === amp
                                    ? "bg-black text-white border-black"
                                    : "bg-transparent text-black/50 border-black/10 hover:border-black"
                            )}
                        >
                            {amp}A
                        </button>
                    ))}
                    {/* RAW LOGS TOGGLE */}
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className={cn(
                            "px-3 py-1 text-xs font-bold border transition-colors ml-4",
                            showRaw
                                ? "bg-red-500 text-white border-red-500 animate-pulse"
                                : "bg-transparent text-black/30 border-black/10 hover:border-black"
                        )}
                    >
                        RAW_LOGS
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Cell Toggles */}
                    {renderCells.map(cell => (
                        <button
                            key={cell}
                            onClick={() => toggleCell(cell)}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1 text-[10px] border transition-all",
                                isVisible(cell) ? "opacity-100 border-black/20 bg-white shadow-sm" : "opacity-40 grayscale border-transparent",
                                isHovered(cell) && "ring-1 ring-black border-black bg-black/5 scale-105"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(cell) }} />
                            {cell}
                        </button>
                    ))}
                </div>
            </div>

            {/* Graph Area */}
            <div className="w-full h-[350px] relative overflow-hidden" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.05} />
                        <XAxis
                            dataKey="capacity"
                            type="number"
                            domain={[0, 'auto']}
                            unit="Ah"
                            tick={{ fontSize: 10, fontFamily: 'monospace' }}
                            stroke="#000000" strokeOpacity={0.2}
                            allowDuplicatedCategory={false}
                        />
                        <YAxis
                            domain={[2.5, 4.2]}
                            unit="V"
                            tick={{ fontSize: 10, fontFamily: 'monospace' }}
                            stroke="#000000" strokeOpacity={0.2}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'black', strokeOpacity: 0.1 }} />

                        {renderCells.map(cell => {
                            if (!isVisible(cell)) return null;
                            const curveData = graphData.data[cell][`${current}A`];
                            if (!curveData) return null;

                            const hovered = isHovered(cell);
                            const strokeWidth = hovered ? 4 : (hoveredProduct ? 1 : (cell.includes("TENPOWER") ? 2.5 : 1.5));
                            const opacity = hoveredProduct && !hovered ? 0.3 : 1;

                            return (
                                <Line
                                    key={cell}
                                    data={curveData}
                                    dataKey="voltage"
                                    name={cell}
                                    cx="capacity"
                                    cy="voltage"
                                    type="monotone"
                                    stroke={getColor(cell)}
                                    strokeWidth={strokeWidth}
                                    strokeOpacity={opacity}
                                    dot={false}
                                    activeDot={false}
                                    isAnimationActive={true}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>

                {/* Overlay Title */}
                <div className="absolute top-4 right-4 text-right pointer-events-none opacity-20">
                    <div className="text-4xl font-bold">{current}A</div>
                    <div className="text-sm">CONSTANT CURRENT DISCHARGE</div>
                </div>
            </div>

            {/* RAW DATA OVERLAY */}
            {showRaw && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 p-4 overflow-auto font-mono text-[10px] text-green-400">
                    <div className="mb-2 font-bold text-white border-b border-white/20 pb-2 flex justify-between">
                        <span>BATCH_METRICS // JSON_DUMP</span>
                        <button onClick={() => setShowRaw(false)} className="text-red-500 hover:text-white">[CLOSE]</button>
                    </div>
                    <pre>{JSON.stringify(graphData.data, null, 2)}</pre>
                </div>
            )}
        </div >
    );
};
