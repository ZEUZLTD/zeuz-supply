
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Connection string from apply_migration.js
const connectionString = 'postgres://postgres.eonvquqwsmzcjxydvqte:Supabase123@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString);

async function run() {
    console.log("Applying Abandoned Cart Schema...");
    const schemaPath = path.resolve(__dirname, 'abandoned_cart_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    try {
        // Simple usage of postgres library to run the raw SQL
        // Note: postgres.js template literal usually expects static strings for safety, 
        // but for migration scripts we often need file content. 
        // 'sql.file(path)' is the best way if available, or just unsafe execution if needed for a one-off.
        // Let's check postgres.js docs memory... `sql.file` exists.

        await sql.file(schemaPath);

        console.log("Schema applied successfully!");
    } catch (e) {
        console.error("Schema Application Error:", e);
    } finally {
        await sql.end();
    }
}

run();
