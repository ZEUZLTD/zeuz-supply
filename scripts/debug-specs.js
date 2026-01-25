const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    // trick to get column names: select one row
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("No rows, cannot infer columns exactly from data, but query worked.");
        }
    }
}

checkSchema();
