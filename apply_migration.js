const postgres = require('postgres');

// Connection string from your Supavisor (Transaction Pooler)
const connectionString = 'postgres://postgres.eonvquqwsmzcjxydvqte:Supabase123@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString);

async function run() {
    console.log("Applying Migration...");
    try {
        await sql`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS tracking_number text,
            ADD COLUMN IF NOT EXISTS carrier text,
            ADD COLUMN IF NOT EXISTS notes text,
            ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
        `;
        console.log("Migration Successful!");
    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        await sql.end();
    }
}

run();
