const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backdate() {
    console.log("Backdating 'manual_test@test.com'...");
    const { data, error } = await supabase
        .from('checkouts')
        .update({ last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }) // 2 hours ago
        .eq('email', 'manual_test@test.com')
        .select();

    if (error) console.error(error);
    else console.log("Backdated:", data);
}

backdate();
