// Native fetch is supported in Node 18+
async function verifyCheckout() {
    try {
        const payload = {
            items: [
                { id: "tp-50xg", quantity: 1, model: "Tenpower 50XG" }
            ],
            email: "liambrt@gmail.com",
            shipping: {
                name: "Liam Thomas",
                line1: "1, The Crescent",
                city: "Stapleford",
                postal_code: "NG9 8JA",
                country: "GB"
            },
            voucherCode: "TEST_50XG_1P"
        };

        console.log("Testing Checkout API with payload:", JSON.stringify(payload, null, 2));

        const response = await fetch('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("Response Status:", response.status);
        console.log("Response Body:", text);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

verifyCheckout();
