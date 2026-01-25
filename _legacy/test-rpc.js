
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    const code = "TEST_PCT_10";

    console.log("Testing with 'code_input'...");
    const { data: data1, error: error1 } = await supabase.rpc('check_voucher', { code_input: code });
    if (error1) console.log("Error 1:", error1.message, error1.details, error1.hint);
    else console.log("Success 1:", data1);

    console.log("\nTesting with 'code'...");
    const { data: data2, error: error2 } = await supabase.rpc('check_voucher', { code: code });
    if (error2) console.log("Error 2:", error2.message, error2.details, error2.hint);
    else console.log("Success 2:", data2);
}

testRpc();
