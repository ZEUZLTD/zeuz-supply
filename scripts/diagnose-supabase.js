
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env manully since we are running via node directly
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2 && !line.startsWith('#')) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && value) env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_KEY;

console.log("-----------------------------------------");
console.log("DIAGNOSTICS");
console.log("URL:", supabaseUrl);
console.log("KEY Length:", supabaseKey ? supabaseKey.length : 0);
console.log("-----------------------------------------");

if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Missing Keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Querying 'products' table...");
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS. Row Count:", data.length);
        console.log("-----------------------------------------");
        data.forEach(p => {
            console.log(`[${p.id}] ${p.name.padEnd(20)} | Price: ${p.price_gbp}`);
        });

        // 2. WRITE TEST
        const testSlug = 'sam-50s';
        const timestamp = new Date().toISOString();
        console.log(`\nATTEMPTING WRITE on '${testSlug}'...`);

        const { error: updateError } = await supabase
            .from('products')
            .update({ pitch: `DIAGNOSTIC WRITE TEST: ${timestamp}` })
            .eq('slug', testSlug);

        if (updateError) {
            console.error("WRITE FAILED:", updateError);
        } else {
            console.log("WRITE SUCCESS. Check Supabase Dashboard for 'pitch' column update.");
        }
        console.log("-----------------------------------------");
    }
}

check();
