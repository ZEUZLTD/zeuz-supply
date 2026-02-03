-- Create or Update the 'order_cancelled' email template
INSERT INTO email_templates (key, subject, body_html)
VALUES (
  'order_cancelled',
  'Urgent: Issue with your Zeuz Order',
  '<div style="font-family: sans-serif; color: #111;">
    <h2>Order Refunded</h2>
    <p>Hi there,</p>
    <p>Unfortunately, we had to cancel and refund your recent order.</p>
    <p><strong>Reason:</strong> {{reason}}</p>
    <p>Your payment has been fully refunded to your card (please allow 5-10 days for it to appear).</p>
    <p>If you believe this is a mistake, please reply to this email.</p>
    <br/>
    <p>Zeuz Supply Team</p>
  </div>'
)
ON CONFLICT (key) DO UPDATE 
SET body_html = EXCLUDED.body_html;
