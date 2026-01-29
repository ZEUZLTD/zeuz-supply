
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase Admin Client for server-side operations
// We use the service role key to bypass RLS potentially, though the schema allows anon insert.
// Using service role is safer for "upsert by email" if RLS restricts viewing others' data.


export async function POST(req: NextRequest) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing Supabase Environment Variables');
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    try {
        const body = await req.json();
        const { email, items, shipping, session_id } = body;

        if (!email || !items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Logic:
        // 1. Check if there is an existing OPEN checkout for this email in the last 24 hours.
        // 2. If yes, update it.
        // 3. If no, create new.

        // We'll use upsert. 
        // Note: 'checkouts' PK is ID. We don't have ID from client usually in first step.
        // Strategy: Query by email + status='OPEN'.

        const { data: existing } = await supabase
            .from('checkouts')
            .select('id')
            .eq('email', email)
            .eq('status', 'OPEN')
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within 24h
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const payload = {
            email,
            items: items,
            metadata: { shipping }, // Store shipping snapshot
            session_id: session_id || null,
            last_active: new Date().toISOString(),
            status: 'OPEN'
        };

        let result;
        if (existing) {
            // Update
            result = await supabase
                .from('checkouts')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            // Insert
            result = await supabase
                .from('checkouts')
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            console.error('Checkout Log Error:', result.error);
            return NextResponse.json({ error: 'Failed to log checkout' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: result.data.id });
    } catch (e) {
        console.error('Checkout Log Exception:', e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
