
import fs from 'fs';
import path from 'path';

// --- DISCHARGE CURVE LOGIC (COPIED FROM data/discharge_curves.ts) ---

interface DischargeCurve {
    capacity: number; // Ah
    voltage: number;  // V
}

const generateCurve = (current: number, resistance: number, capacity: number, sagFactor: number) => {
    const points: DischargeCurve[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
        const ah = (i / steps) * capacity;
        const soc = i / steps;

        let ocv = 4.2 - (0.5 * soc) - (0.2 * Math.pow(soc, 2)) - (0.8 * Math.pow(soc, 10));
        const ir = current * resistance * (1 + soc);

        let v = ocv - ir - (sagFactor * current * 0.01);
        if (v < 2.5) v = 2.5;
        if (v > 4.2) v = 4.2;

        points.push({ capacity: ah, voltage: v });
    }
    return points;
};

// Recreated Data Mapping
const MIGRATION_DATA: { [model: string]: any } = {
    "TENPOWER INR-50XG": {
        "1A": generateCurve(1, 0.004, 5.0, 0),
        "10A": generateCurve(10, 0.004, 5.0, 0.5),
        "20A": generateCurve(20, 0.004, 4.9, 1.0),
        "40A": generateCurve(40, 0.005, 4.8, 2.0)
    },
    "SAMSUNG 50S": {
        "1A": generateCurve(1, 0.006, 5.0, 0),
        "10A": generateCurve(10, 0.006, 4.9, 0.8),
        "20A": generateCurve(20, 0.007, 4.8, 1.5),
        "40A": generateCurve(40, 0.008, 4.5, 3.0)
    },
    "MOLICEL P50B": {
        "1A": generateCurve(1, 0.003, 5.0, 0),
        "10A": generateCurve(10, 0.003, 5.0, 0.3),
        "20A": generateCurve(20, 0.003, 4.9, 0.6),
        "40A": generateCurve(40, 0.0035, 4.8, 1.2)
    },
    "LG M58T": {
        "0.5A": generateCurve(0.5, 0.018, 5.8, 0),
        "1A": generateCurve(1, 0.018, 5.8, 0.5),
        "5A": generateCurve(5, 0.020, 5.7, 1.5),
        "10A": generateCurve(10, 0.025, 5.6, 3.0)
    },
    "TENPOWER 58HE": {
        "0.5A": generateCurve(0.5, 0.020, 5.8, 0),
        "1A": generateCurve(1, 0.020, 5.8, 0.6),
        "5A": generateCurve(5, 0.022, 5.7, 1.8),
        "10A": generateCurve(10, 0.028, 5.5, 3.5)
    },
    "VAPCELL F63": {
        "0.5A": generateCurve(0.5, 0.016, 6.25, 0),
        "1A": generateCurve(1, 0.016, 6.25, 0.4),
        "5A": generateCurve(5, 0.018, 6.1, 1.2),
        "10A": generateCurve(10, 0.022, 6.0, 2.5)
    }
};

async function generateSQL() {
    console.log("Generating SQL Migration...");

    let sql = `-- Migration: Populate graph_data in batches
-- Generated automatically by scripts/migrate_graph_data.ts

`;

    for (const [model, data] of Object.entries(MIGRATION_DATA)) {
        // Find product ID by name - WE CAN'T without connection usually, 
        // BUT we can use a subquery!
        // UPDATE batches SET graph_data = '...' WHERE product_id = (SELECT id FROM products WHERE name = '...');

        const jsonString = JSON.stringify(data).replace(/'/g, "''"); // Escape single quotes

        sql += `
UPDATE batches 
SET graph_data = '${jsonString}'::jsonb 
WHERE product_id IN (SELECT id FROM products WHERE name = '${model}');
`;
    }

    const outputPath = path.resolve(__dirname, '../supabase/migrations/phase10_graph_data.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`SQL migration written to: ${outputPath}`);
}

generateSQL();
