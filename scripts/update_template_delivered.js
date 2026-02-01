const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// SHARED STYLES (Industrial Theme)
const THEME = {
    bg: '#000000',
    text: '#cccccc',
    accent: '#ffffff',
    border: '#333333',
    font: 'Menlo, Consolas, Monaco, monospace'
};

const BASE_STYLES = `
    body { background-color: ${THEME.bg}; color: ${THEME.text}; font-family: ${THEME.font}; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: left; }
    .logo { color: ${THEME.accent}; font-weight: 900; letter-spacing: -1px; font-size: 24px; text-decoration: none; display: inline-block; margin-bottom: 40px; }
    .h1 { color: ${THEME.accent}; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; font-weight: bold; }
    .p { font-size: 12px; line-height: 1.6; color: ${THEME.text}; margin-bottom: 20px; }
    .code-block { background: #111; border: 1px solid #333; padding: 20px; text-align: center; margin: 30px 0; }
    .voucher { color: ${THEME.accent}; font-size: 24px; letter-spacing: 4px; font-weight: bold; display: block; margin-bottom: 10px; }
    .label { color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .btn { display: inline-block; background: ${THEME.accent}; color: ${THEME.bg}; padding: 12px 24px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 20px; }
    .footer { border-top: 1px solid ${THEME.border}; margin-top: 40px; padding-top: 20px; font-size: 10px; color: #444; }
`;

async function main() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        process.exit(1);
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const template = {
        key: 'order_delivered',
        subject: 'PROTOCOL COMPLETE // ORDER {{order_id}}',
        body_html: `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>${BASE_STYLES}</style>
        </head>
        <body>
            <div class="container">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="logo">ZEUZ // SUPPLY</a>
                
                <h1 class="h1">MISSION STATUS: ACCOMPLISHED</h1>

                <p class="p">
                    LOG: DELIVERY CONFIRMED.<br/>
                    REF: {{order_id}}<br/>
                    STATUS: HARDWARE DEPLOYED
                </p>

                <p class="p">
                   Your supply drop has been marked as delivered. 
                   Loyalty protocol initiated for verified operator.
                </p>

                <div class="code-block">
                    <span class="label">IDENTITY REWARD ASSIGNED</span><br/><br/>
                    <span class="voucher">{{voucher_code}}</span><br/>
                    <span class="label" style="color: #4CAF50;">>> 15% CREDIT ACTIVE</span>
                </div>

                <p class="p" style="text-align: center;">
                    This protocol code has been locked to your identity.<br/>
                    Authorized for next requisition only.
                </p>

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="btn">REQUISITION NEW SUPPLY</a>
                </div>

                <div class="footer">
                    ZEUZ SUPPLY LTD // INFRASTRUCTURE OF POWER<br/>
                    LONDON, UK // EST. 2024
                </div>
            </div>
        </body>
        </html>`
    };

    const { error } = await supabase
        .from('email_templates')
        .upsert(template, { onConflict: 'key' });

    if (error) console.error(error);
    else console.log("Template 'order_delivered' updated.");
}

main();
