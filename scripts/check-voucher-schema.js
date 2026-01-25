const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log("Checking 'vouchers' table columns...");
    const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'vouchers' });

    // If inspect_table_columns doesn't exist, try a simple query
    if (error) {
        console.log("RPC failed, trying direct select limit 1...");
        const { data: row, error: queryError } = await supabase.from('vouchers').select('*').limit(1).single();
        if (queryError) {
            console.error("Direct query failed:", queryError.message);
        } else {
            console.log("Table columns found:", Object.keys(row));
        }
    } else {
        console.log("Columns:", data);
    }
}

checkSchema();
