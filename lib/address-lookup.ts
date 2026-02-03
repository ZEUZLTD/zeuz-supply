
export interface AddressResult {
    line1: string;
    line2: string;
    city: string;
    county: string;
    postal_code: string;
    country: string;
}

export interface IdealPostcodesResponse {
    result: {
        line_1: string;
        line_2: string;
        post_town: string;
        county: string;
        postcode: string;
    }[];
    code: number;
    message: string;
}

const API_BASE = "https://api.ideal-postcodes.co.uk/v1";

export async function lookupAddress(postcode: string, apiKey: string): Promise<AddressResult[]> {
    if (!postcode || !apiKey) return [];

    try {
        const response = await fetch(`${API_BASE}/postcodes/${encodeURIComponent(postcode)}?api_key=${apiKey}`);
        const data = await response.json() as IdealPostcodesResponse;

        if (data.code === 2000 && Array.isArray(data.result)) {
            return data.result.map(addr => ({
                line1: addr.line_1,
                line2: addr.line_2,
                city: addr.post_town,
                county: addr.county,
                postal_code: addr.postcode, // Use returned postcode ensuring correct format
                country: 'GB'
            }));
        }
        return [];
    } catch (error) {
        console.error("Address Lookup Failed:", error);
        return [];
    }
}
