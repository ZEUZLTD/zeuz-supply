const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const THEME = {
    bg: '#050505',
    text: '#E5E5E5',
    border: '#333333',
    accent_red: '#FF3300',
    accent_green: '#00FF99',
    accent_muted: '#404040',
    font: '"Courier New", Courier, monospace'
};

const BASE_STYLES = `
    body { background-color: ${THEME.bg}; color: ${THEME.text}; font-family: ${THEME.font}; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; border: 1px solid ${THEME.border}; background-color: #0A0A0A; }
    .header { padding: 20px; border-bottom: 1px solid ${THEME.border}; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: 4px; color: ${THEME.text}; }
    .status-badge { font-size: 10px; padding: 4px 8px; border: 1px solid ${THEME.accent_muted}; color: ${THEME.accent_muted}; text-transform: uppercase; }
    .content { padding: 40px 20px; }
    .h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; color: white; border-bottom: 1px solid ${THEME.border}; padding-bottom: 15px; }
    .p { font-size: 12px; line-height: 1.6; margin-bottom: 15px; color: #CCCCCC; }
    .btn { display: inline-block; background: ${THEME.text}; color: ${THEME.bg}; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-top: 20px; }
    .btn:hover { background: white; }
    .grid { display: table; width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
    .row { display: table-row; border-bottom: 1px solid #222; }
    .cell-key { display: table-cell; padding: 10px 0; font-size: 10px; color: #888; text-transform: uppercase; width: 40%; }
    .cell-val { display: table-cell; padding: 10px 0; font-size: 12px; color: white; font-weight: bold; text-align: right; }
    .footer { padding: 20px; border-top: 1px solid ${THEME.border}; font-size: 10px; color: #666; text-align: center; background: #080808; }
`;

const templates = [
    {
        key: 'order_confirmation',
        subject: 'PURCHASE ORDER // CONFIRMED',
        description: 'Order receipt',
        body_html: `<!DOCTYPE html>
<html>
<head>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ZEUZ</div>
            <div class="status-badge" style="color: ${THEME.accent_green}; border-color: ${THEME.accent_green};">PAYMENT CLEARED</div>
        </div>
        <div class="content">
            <div class="h1">ORDER MANIFEST: {{order_id}}</div>
            <p class="p">Transaction authorized. Fabrication/Fulfillment protocols initiated.</p>
            
            <p class="p" style="margin-top: 20px; font-weight: bold; color: white; border-bottom: 1px solid #333; padding-bottom: 5px;">MANIFEST:</p>
            
            <!-- Items Injection Point -->
            {{items_html}}

            <div class="grid" style="margin-top: 20px; border-top: 1px solid white;">
                <div class="row">
                    <div class="cell-key">TOTAL</div>
                    <div class="cell-val">{{total}} {{currency}}</div>
                </div>
                <div class="row">
                    <div class="cell-key">DATE</div>
                    <div class="cell-val">{{date}}</div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="{{order_link}}" class="btn">VIEW FULL MANIFEST</a>
            </div>

            <p class="p" style="margin-top: 20px; text-align: center;">You will receive a subsequent transmission upon dispatch.</p>
        </div>
        <div class="footer">
            ZEUZ INFRASTRUCTURE // ORDER-CONF
        </div>
    </div>
</body>
</html>`
    },
    {
        key: 'order_shipped',
        subject: 'LOGISTICS UPDATE // DISPATCHED',
        description: 'Shipping notification',
        body_html: `<!DOCTYPE html>
<html>
<head>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ZEUZ</div>
            <div class="status-badge" style="color: ${THEME.accent_green}; border-color: ${THEME.accent_green};">IN TRANSIT</div>
        </div>
        <div class="content">
            <div class="h1">SHIPMENT RELEASED</div>
            <p class="p">Your hardware has left the distribution node.</p>
            
            <div class="grid">
                <div class="row">
                    <div class="cell-key">CARRIER</div>
                    <div class="cell-val">{{carrier}}</div>
                </div>
                <div class="row">
                    <div class="cell-key">TRACKING NO</div>
                    <div class="cell-val">{{tracking_number}}</div>
                </div>
            </div>
            
            <p class="p" style="margin-top: 20px; font-weight: bold; color: white; border-bottom: 1px solid #333; padding-bottom: 5px;">PAYLOAD:</p>
            
            <!-- Items Injection Point -->
            {{items_html}}

            <div style="text-align: center; margin-top: 30px;">
                <a href="https://www.google.com/search?q={{tracking_number}}" class="btn">TRACK SHIPMENT</a>
                <br/>
                <a href="{{order_link}}" style="display: inline-block; margin-top: 15px; color: #666; font-size: 10px; text-decoration: none;">VIEW ORDER DETAILS</a>
            </div>
        </div>
        <div class="footer">
            ZEUZ LOGISTICS // SHIP-NOTIFY
        </div>
    </div>
</body>
</html>`
    }
];

async function update() {
    console.log("Updating templates with Enhanced Manifests...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    for (const t of templates) {
        // Upsert merging logic or full replace? Full replace is safer for HTML.
        const { error } = await supabase
            .from('email_templates')
            .upsert(t, { onConflict: 'key' });

        if (error) {
            console.error(`[FAIL] ${t.key}:`, error.message);
        } else {
            console.log(`[OK]   ${t.key}`);
        }
    }
}

update().catch(console.error);
