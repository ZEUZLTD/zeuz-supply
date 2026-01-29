import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleOrderCompletion } from '@/lib/order-utils';



export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
        return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    try {
        if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
        }

        const result = await handleOrderCompletion(session);
        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Confirm Order Error:", e);
        return NextResponse.json({ error: e.message || "Confirmation failed" }, { status: 500 });
    }
}
