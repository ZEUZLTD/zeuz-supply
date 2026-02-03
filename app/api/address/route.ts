import { NextResponse } from 'next/server';
import { lookupAddress } from "@/lib/address-lookup";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('query');

    if (!postcode) {
        return NextResponse.json({ error: "Postcode required" }, { status: 400 });
    }

    // Use Environment Variable for Key
    // Fallback to a clear error/mock if missing in dev?
    // User hasn't provided key yet, so this will fail gracefully or return empty.
    const apiKey = process.env.IDEAL_POSTCODES_API_KEY;

    if (!apiKey) {
        // Return Mock Data for Demo purposes if key is missing (for user verification)
        // OR return error. Let's return error so they know to add key.
        // Actually, for "Test", let's enable the public test key if in dev?
        // Ideal Postcodes has a public test key 'iddqd' (Doom god mode reference) for specific test postcodes (e.g. ID1 1QD).
        // Let's use 'iddqd' if no env var is present, to allow testing 'ID1 1QD'.
        const testKey = 'iddqd';
        console.warn("Using TEST API Key (iddqd) - Setup IDEAL_POSTCODES_API_KEY for production.");

        const results = await lookupAddress(postcode, testKey);
        return NextResponse.json({ addresses: results, warning: "Using Test Key" });
    }

    const results = await lookupAddress(postcode, apiKey);
    return NextResponse.json({ addresses: results });
}
