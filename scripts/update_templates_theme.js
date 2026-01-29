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
        key: 'abandoned_cart',
        subject: 'SESSION HALTED // CART PENDING',
        description: 'Sent when use leaves items in cart.',
        body_html: `<!DOCTYPE html>
<html>
<head>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ZEUZ</div>
            <div class="status-badge" style="color: ${THEME.accent_red}; border-color: ${THEME.accent_red};">ACTION REQUIRED</div>
        </div>
        <div class="content">
            <div class="h1" style="color: ${THEME.accent_red};">SESSION INTERRUPTED</div>
            <p class="p">Our systems detected an incomplete transaction sequence. Your allocated inventory remains in holding state for a limited window.</p>
            <p class="p">Proceed to checkout to secure your hardware.</p>
            
            <a href="{{cart_url}}" class="btn" style="background: ${THEME.accent_red}; color: black;">RESTORE SESSION</a>
        </div>
        <div class="footer">
            SYSTEM ID: CART-REC-001 // ZEUZ SUPPLY
        </div>
    </div>
</body>
</html>`
    },
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
            
            <div class="grid">
                <div class="row">
                    <div class="cell-key">ORDER ID</div>
                    <div class="cell-val">{{order_id}}</div>
                </div>
                <div class="row">
                    <div class="cell-key">TOTAL</div>
                    <div class="cell-val">{{total}} {{currency}}</div>
                </div>
                <div class="row">
                    <div class="cell-key">DATE</div>
                    <div class="cell-val">{{date}}</div>
                </div>
                 <div class="row">
                    <div class="cell-key">STATUS</div>
                    <div class="cell-val" style="color: ${THEME.accent_green}">CONFIRMED</div>
                </div>
            </div>

            <p class="p" style="margin-top: 20px;">You will receive a subsequent transmission upon dispatch.</p>
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
            <p class="p">Your hardward has left the distribution node.</p>
            
            <div class="grid">
                <div class="row">
                    <div class="cell-key">ORDER REF</div>
                    <div class="cell-val">{{order_id}}</div>
                </div>
                <div class="row">
                    <div class="cell-key">CARRIER</div>
                    <div class="cell-val">{{carrier}}</div>
                </div>
                <div class="row">
                    <div class="cell-key">TRACKING NO</div>
                    <div class="cell-val">{{tracking_number}}</div>
                </div>
            </div>

            <a href="https://www.google.com/search?q={{tracking_number}}" class="btn">TRACK SHIPMENT</a>
        </div>
        <div class="footer">
            ZEUZ LOGISTICS // SHIP-NOTIFY
        </div>
    </div>
</body>
</html>`
    },
    {
        key: 'contact_acknowledgment',
        subject: 'COMMUNICATION // RECEIVED',
        description: 'Contact form auto-reply',
        body_html: `<!DOCTYPE html>
<html>
<head>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ZEUZ</div>
            <div class="status-badge">TICKET OPEN</div>
        </div>
        <div class="content">
            <div class="h1">TRANSMISSION RECEIVED</div>
            <p class="p">This automated response acknowledges receipt of your inquiry.</p>
            <p class="p">A human operator has been signaled and will review your message shortly.</p>
            
            <div style="background: #111; padding: 15px; font-size: 11px; margin-top: 20px; border-left: 2px solid ${THEME.text}; color: #888;">
                {{message_preview}}
            </div>
        </div>
        <div class="footer">
            ZEUZ SUPPORT // ACK
        </div>
    </div>
</body>
</html>`
    },
    {
        key: 'newsletter_welcome',
        subject: 'DISTRIBUTION LIST // ACTIVE',
        description: 'Newsletter welcome',
        body_html: `<!DOCTYPE html>
<html>
<head>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ZEUZ</div>
            <div class="status-badge" style="color: ${THEME.text}; border-color: ${THEME.text};">SUBSCRIBED</div>
        </div>
        <div class="content">
            <div class="h1">PROTOCOL INITIATED</div>
            <p class="p">You have been added to the internal distribution list.</p>
            
            <div style="margin: 20px 0; border: 1px solid #222; padding: 15px;">
                <p class="p" style="margin:0; font-weight:bold; color:white;">EXPECTED INTEL:</p>
                <ul style="padding-left: 20px; margin-top: 10px; font-size: 12px; color: #BBB;">
                    <li style="margin-bottom: 5px;">High-discharge cell drops</li>
                    <li style="margin-bottom: 5px;">Prototype hardware availability</li>
                    <li>Technical schematics</li>
                </ul>
            </div>
            
            <p class="p">Stand by for updates.</p>
        </div>
        <div class="footer">
            ZEUZ BROADCAST // SUB-WELCOME
        </div>
    </div>
</body>
</html>`
    }
];

async function update() {
    console.log("Updating templates with Industrial Theme...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    for (const t of templates) {
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
