
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export interface ShippingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
    email?: string;
}

/**
 * Strict UK Postcode Regex
 * Matches standard formats: AA9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, etc.
 * Handles case insensitivity and optional space.
 */
const UK_POSTCODE_REGEX = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/;

/**
 * Restricted Prefixes for "Mainland Only" Shipping.
 * BT = Northern Ireland
 * IM = Isle of Man
 * GY = Guernsey
 * JE = Jersey
 * ZE = Shetland (Zetland)
 * HS = Outer Hebrides
 */
const NON_MAINLAND_PREFIXES = ['BT', 'IM', 'GY', 'JE', 'ZE', 'HS'];

/**
 * Validates strictly the postcode component for UK Mainland Check
 */
export function validateUKPostcode(postcode: string): ValidationResult {
    const pc = postcode?.trim().toUpperCase();
    if (!pc) return { isValid: false, error: "Postcode is required." };

    if (!UK_POSTCODE_REGEX.test(pc)) {
        return { isValid: false, error: "Invalid UK Postcode format." };
    }

    const prefix = pc.substring(0, 2);
    if (NON_MAINLAND_PREFIXES.includes(prefix)) {
        if (prefix === 'BT') return { isValid: false, error: "We currently do not ship to Northern Ireland." };
        return { isValid: false, error: `We do not ship to '${prefix}' postcodes (Mainland Only).` };
    }

    return { isValid: true };
}

/**
 * Validates a shipping address for UK Mainland delivery.
 * @deprecated - We are moving to Stripe-hosted collection, enabling only Postcode check is preferred.
 */
export function validateShippingAddress(address: ShippingAddress): ValidationResult {
    // 1. Basic Field Checks
    if (!address.name?.trim()) return { isValid: false, error: "Name is required." };
    if (!address.line1?.trim()) return { isValid: false, error: "Address Line 1 is required." };
    if (!address.city?.trim()) return { isValid: false, error: "City is required." };

    // 2. Postcode
    return validateUKPostcode(address.postal_code);
}
