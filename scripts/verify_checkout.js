const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Service Role Key.");
    console.log("URL present:", !!supabaseUrl);
    console.log("Service Key present:", !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Querying checkouts table for ALL records...");
    const { data, error } = await supabase
        .from('checkouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error querying checkouts:", error);
    } else {
        console.log(`Found ${data.length} records.`);
        if (data.length > 0) {
            console.log("Latest record:", JSON.stringify(data[0], null, 2));
        }
    }
}

check();
