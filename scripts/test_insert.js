const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Attempting manual insert...");
    const payload = {
        email: 'manual_test@test.com',
        items: [{ id: 'test-item', quantity: 1 }],
        status: 'OPEN',
        metadata: { source: 'manual_script' }
    };

    const { data, error } = await supabase
        .from('checkouts')
        .insert(payload)
        .select();

    if (error) {
        console.error("Manual insert failed:", error);
    } else {
        console.log("Manual insert success:", data);
    }
}

testInsert();
