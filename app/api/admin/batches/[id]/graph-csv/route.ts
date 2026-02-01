import { getSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseServer();

    // 1. Fetch Batch Data
    const { data: batch, error } = await supabase
        .from('batches')
        .select('graph_data, batch_code')
        .eq('id', params.id)
        .single();

    if (error || !batch) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // 2. Format as CSV
    // Header: current_a, capacity_ah, voltage_v
    let csv = "current_a,capacity_ah,voltage_v\n";

    const graphData = batch.graph_data as Record<string, Array<{ capacity: number, voltage: number }>> | null;

    if (graphData) {
        // Sort currents numerically (e.g. 10A, 20A)
        const currents = Object.keys(graphData).sort((a, b) => {
            return parseFloat(a) - parseFloat(b);
        });

        currents.forEach(currentKey => {
            const points = graphData[currentKey];
            const currentVal = parseFloat(currentKey); // "10A" -> 10

            points.forEach(point => {
                csv += `${currentVal},${point.capacity},${point.voltage}\n`;
            });
        });
    }

    // 3. Return as File Download
    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="graph_data_${batch.batch_code}.csv"`
        }
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseServer();

    // 1. Read File
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const rows = text.split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('current_a')); // Skip header and empty lines

    // 2. Parse CSV
    const newGraphData: Record<string, Array<{ capacity: number, voltage: number }>> = {};

    try {
        rows.forEach((row) => {
            const cols = row.split(',');
            if (cols.length < 3) return; // Skip invalid rows

            const current = parseFloat(cols[0]);
            const capacity = parseFloat(cols[1]);
            const voltage = parseFloat(cols[2]);

            if (isNaN(current) || isNaN(capacity) || isNaN(voltage)) return;

            const key = `${current}A`; // Reconstruct key "10A"

            if (!newGraphData[key]) {
                newGraphData[key] = [];
            }

            newGraphData[key].push({ capacity, voltage });
        });

        // 3. Update Database
        const { error } = await supabase
            .from('batches')
            .update({
                graph_data: newGraphData
            })
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true, count: rows.length });

    } catch (e) {
        console.error("CSV Parse Error", e);
        return NextResponse.json({ error: "Failed to parse CSV or update DB" }, { status: 500 });
    }
}
