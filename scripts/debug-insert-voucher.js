const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    console.log("Attempting to insert dummy voucher...");

    const code = 'TEST_' + Math.floor(Math.random() * 10000);

    const payload = {
        code: code,
        type: 'FIXED_PRICE',
        active: true,
        used_count: 0,
        min_spend: null,
        // Explicitly casting array to ensure JSONB compatibility if needed, 
        // but Supabase client should handle raw arrays for JSONB columns.
        product_ids: ['molicel-p45b', 'samsung-50s'],
        max_usage_per_cart: 2,
        max_global_uses: 100,
        start_date: new Date().toISOString(),
        expiry_date: null,
        is_free_shipping: true,
        discount_amount: 10
    };

    const { data, error } = await supabase.from('vouchers').insert(payload).select();

    if (error) {
        console.log("---------------- ERROR START ----------------");
        console.log(JSON.stringify(error, null, 2));
        console.log("---------------- ERROR END ------------------");
    } else {
        console.log("✅ Insert Success:", JSON.stringify(data, null, 2));

        // Cleanup
        await supabase.from('vouchers').delete().eq('code', code);
    }
}

testInsert();
