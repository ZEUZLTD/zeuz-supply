const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
    console.log("Initializing Schema Update...");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials.");
        process.exit(1);
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Add Columns (via SQL RPC or direct query if possible, but here we can't run DDL easily without SQL editor access usually)
    // However, if we don't have SQL access, we might struggle. 
    // Wait, the agent has 'run_command' but no psql. 
    // We can try to use standard Supabase 'rpc' if a potentially dangerous 'exec_sql' exists (unlikely).
    // OR: We assume the user can run SQL, OR we try to insert and see if it fails?
    // Actually, I cannot ALTER TABLE via the JS Client unless I have a specific RPC set up.

    // ALTERNATIVE: Use the API route /api/debug-db or similar? No.
    // OPTION: Notify user to run SQL? Or try to use the 'postgres' connection string if I had it? I don't.

    // WAIT: I can use the 'run_command' to run a migration if there is a migration tool? No.

    // Let's TRY to just Upsert typical Supabase way. If columns don't exist, it will throw.
    // If it throws, I will have to ask the User to create the columns via SQL Editor.
    // BUT! I can print the SQL for them.

    // Let's check if columns exist first by inspecting one row?
    const { data: voucherCheck, error: checkError } = await supabase.from('vouchers').select('*').limit(1);

    if (checkError) {
        console.error("Error accessing vouchers table:", checkError);
    } else {
        const row = voucherCheck?.[0] || {};
        const hasAllowedEmails = 'allowed_emails' in row;
        const hasFirstOrder = 'is_first_order_only' in row;

        if (!hasAllowedEmails || !hasFirstOrder) {
            console.log("\n!!! CRITICAL !!!");
            console.log("The columns 'allowed_emails' and/or 'is_first_order_only' do NOT exist.");
            console.log("Please run the following SQL in your Supabase SQL Editor:");
            console.log("-----------------------------------------------------------");
            console.log(`
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS allowed_emails text[];
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS is_first_order_only boolean DEFAULT false;
            `);
            console.log("-----------------------------------------------------------\n");

            // We can't proceed with seeding if columns are missing for the specific logic
            // But we CAN seed the basic vouchers without those columns if we omit them for now?
            // No, the plan relies on them.
            console.log("Waiting for Schema change... (Script will exit)");
            process.exit(1);
        }
    }

    // 2. Seed Vouchers
    const vouchers = [
        {
            code: 'PROTOCOL_REWARD',
            type: 'PERCENT',
            discount_percent: 15,
            active: true,
            allowed_emails: [], // Empty initially
            is_first_order_only: false
        },
        {
            code: 'INITIATION_10',
            type: 'PERCENT',
            discount_percent: 10,
            active: true,
            allowed_emails: null, // Public
            is_first_order_only: true // Restricted
        },
        {
            code: 'ZEUZ_5',
            type: 'PERCENT',
            discount_percent: 5,
            active: true,
            allowed_emails: null, // Public
            is_first_order_only: false
        }
    ];

    for (const v of vouchers) {
        const { data, error } = await supabase
            .from('vouchers')
            .upsert(v, { onConflict: 'code' })
            .select();

        if (error) {
            console.error(`Failed to seed ${v.code}:`, error.message);
        } else {
            console.log(`Seeded ${v.code}`);
        }
    }

    console.log("Schema Update check & Seeding Complete.");
}

main().catch(e => console.error(e));
