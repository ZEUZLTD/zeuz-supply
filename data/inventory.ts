export const INVENTORY = [
    // SECTION 1: HIGH DISCHARGE (POWER)
    {
        id: "tp-50xg",
        model: "TENPOWER INR-50XG",
        spec: "5000mAh / 40A",
        tag: "THE KING",
        pitch: "The Low-Resistance King. Runs cooler than the Samsung 50S. Verified 4mΩ.",
        price: 5.50,
        category: "POWER",
        status: "IN_STOCK",
        // Specs
        weight_g: 70,
        nominal_voltage_v: 3.6,
        charge_voltage_v: 4.2,
        discharge_cutoff_v: 2.5,
        standard_charge_a: 2.5,
        max_discharge_a: 40,
        ac_impedance_mohm: 12
    },
    {
        id: "sam-50s",
        model: "SAMSUNG 50S",
        spec: "5000mAh / 25A",
        tag: "BENCHMARK",
        pitch: "The Industry Standard. We stock this so you can see just how much better the 50XG is.",
        price: 5.80,
        category: "POWER",
        status: "IN_STOCK",
        weight_g: 72,
        nominal_voltage_v: 3.6,
        charge_voltage_v: 4.2,
        discharge_cutoff_v: 2.5,
        standard_charge_a: 2.5,
        max_discharge_a: 25,
        ac_impedance_mohm: 14
    },
    {
        id: "mol-p50b",
        model: "MOLICEL P50B",
        spec: "5000mAh / 60A",
        tag: "UNICORN",
        pitch: "The true successor to the P45B. Limited allocation only.",
        price: 8.00,
        category: "POWER",
        status: "LOW_STOCK", // Triggers distinct UI warning
        weight_g: 68,
        nominal_voltage_v: 3.6,
        charge_voltage_v: 4.2,
        discharge_cutoff_v: 2.65,
        standard_charge_a: 5.0,
        max_discharge_a: 50,
        ac_impedance_mohm: 8
    },

    // SECTION 2: HIGH ENERGY (RANGE)
    {
        id: "lg-m58t",
        model: "LG M58T",
        spec: "5800mAh / 12.5A",
        tag: "RANGE KING",
        pitch: "Highest capacity Tier-1 cell in the UK. 16% more range than a 50E.",
        price: 6.20,
        category: "ENERGY",
        status: "IN_STOCK"
    },
    {
        id: "tp-58he",
        model: "TENPOWER 58HE",
        spec: "5800mAh / 10A",
        tag: "VALUE",
        pitch: "The Value Alternative to LG. Massive capacity, lower price.",
        price: 4.50,
        category: "ENERGY",
        status: "IN_STOCK"
    },
    {
        id: "vap-f63",
        model: "FEB 6250 / VAPCELL F63",
        spec: "6250mAh / 12.5A",
        tag: "SPEC WINNER",
        pitch: "Breaking the 6Ah barrier. Silicon-Carbon technology available today.",
        price: 7.50,
        category: "ENERGY",
        status: "IN_STOCK"
    },

    // SECTION 3: THE ROADMAP (FUTURE)
    {
        id: "tp-60xg",
        model: "TENPOWER 60XG",
        spec: "6000mAh / 40A",
        tag: "HOLY GRAIL",
        pitch: "Capacity + 40A Discharge. The future of E-Bikes.",
        category: "PROTOTYPE",
        status: "COMING_SOON"
    },
    {
        id: "mol-p60b",
        model: "MOLICEL P60B",
        spec: "6000mAh / 100A",
        tag: "DANGEROUS",
        pitch: "The cell that makes mechanical mods dangerous again.",
        category: "PROTOTYPE",
        status: "COMING_SOON"
    },
    {
        id: "mol-m65a",
        model: "MOLICEL M65A",
        spec: "6500mAh / 26A",
        tag: "LIMIT BREAK",
        pitch: "The absolute physical limit of the 21700 format.",
        category: "PROTOTYPE",
        status: "COMING_SOON"
    }
];
