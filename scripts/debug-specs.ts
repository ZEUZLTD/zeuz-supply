
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProduct() {
    console.log("Fetching one product...");
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', 'tp-50xg')
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Product Keys found:", Object.keys(data));
    console.log("Sample Data:", JSON.stringify(data, null, 2));

    // Access specific tech specs to see if they are 'undefined' or just not in the row
    const specs = [
        'nominal_voltage_v',
        'charge_voltage_v',
        'discharge_cutoff_v',
        'max_discharge_a',
        'standard_charge_a',
        'ac_impedance_mohm',
        'weight_g'
    ];

    console.log("\n--- Tech Specs Check ---");
    specs.forEach(key => {
        console.log(`${key}: ${data[key]}`);
    });
}

inspectProduct();
