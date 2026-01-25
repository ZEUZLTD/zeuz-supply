const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRpc() {
    const code = 'ADMIN1P';
    console.log(`Debugging RPC for code: ${code}`);

    const { data, error } = await supabase.rpc('check_voucher', {
        code_input: code
    });

    if (error) {
        console.error("RPC Error:", error.message);
        console.log("Details:", error);
    } else {
        console.log("RPC Result:", JSON.stringify(data, null, 2));
    }
}

debugRpc();
