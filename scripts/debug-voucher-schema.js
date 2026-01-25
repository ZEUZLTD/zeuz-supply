const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log("Checking 'vouchers' table schema...");

    // Try to insert a dummy record with new fields to see if it fails, OR just select limits
    // Better: Query Postgres information_schema via RPC if possible, or just fail-testing.

    // Strategy: Try to select the new columns. If they don't exist, it will error.
    const { data, error } = await supabase
        .from('vouchers')
        .select('id, product_ids, start_date, max_usage_per_cart, is_free_shipping')
        .limit(1);

    if (error) {
        console.error("❌ Schema Check Failed:", error.message);
        console.log("Details:", error);
    } else {
        console.log("✅ Columns exist! Query success.");
    }
}

checkSchema();
