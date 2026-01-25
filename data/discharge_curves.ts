export interface DischargeCurve {
    capacity: number; // Ah
    voltage: number;  // V
}

export type CellCurves = {
    [current: string]: DischargeCurve[];
};

export type SectionGraphs = {
    cells: string[];
    currents: number[];
    data: {
        [cellName: string]: CellCurves;
    };
};

// Helper to generate a curve
const generateCurve = (current: number, resistance: number, capacity: number, sagFactor: number) => {
    const points: DischargeCurve[] = [];
    const steps = 50;

    // Base OCV curve (Li-ion typical)
    // 4.2V -> 2.5V
    // Simple model: V = 4.2 - (0.5 * SOC) - (0.5 * SOC^2) - I*R

    for (let i = 0; i <= steps; i++) {
        const ah = (i / steps) * capacity;
        const soc = i / steps; // 0 to 1 (Discharged)

        // Open Circuit Voltage approximation
        // 4.2 start, 3.6 nominal, 3.0 cliff
        let ocv = 4.2 - (0.5 * soc) - (0.2 * Math.pow(soc, 2)) - (0.8 * Math.pow(soc, 10)); // Cliff at end

        // Voltage Sag = I * R
        // R increases at end of discharge
        const ir = current * resistance * (1 + soc);

        let v = ocv - ir - (sagFactor * current * 0.01);
        if (v < 2.5) v = 2.5; // Cutoff
        if (v > 4.2) v = 4.2;

        points.push({ capacity: ah, voltage: v });
    }
    return points;
};

export const DISCHARGE_DATA: { [key: string]: SectionGraphs } = {
    POWER: {
        cells: ["TENPOWER INR-50XG", "SAMSUNG 50S", "MOLICEL P50B"],
        currents: [1, 10, 20, 40],
        data: {
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
                "40A": generateCurve(40, 0.008, 4.5, 3.0) // Sags more
            },
            "MOLICEL P50B": {
                "1A": generateCurve(1, 0.003, 5.0, 0), // Updated to 5.0Ah for P50B
                "10A": generateCurve(10, 0.003, 5.0, 0.3),
                "20A": generateCurve(20, 0.003, 4.9, 0.6),
                "40A": generateCurve(40, 0.0035, 4.8, 1.2) // P50B performs slightly better
            }
        }
    },
    ENERGY: {
        cells: ["LG M58T", "TENPOWER 58HE", "VAPCELL F63"],
        currents: [0.5, 1, 5, 10],
        data: {
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
        }
    }
};
