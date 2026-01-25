const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInquiries() {
    const { data, error } = await supabase.from('inquiries').select('*').limit(1);
    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.log("Table 'inquiries' does NOT exist.");
        } else {
            console.error("Error:", error);
        }
    } else {
        console.log("Table 'inquiries' exists. Columns:", data.length > 0 ? Object.keys(data[0]) : "Empty table, generic check passed.");
    }
}

checkInquiries();
