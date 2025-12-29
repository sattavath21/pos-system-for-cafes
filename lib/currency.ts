// Currency utilities for Laos Kips (LAK)

export const LAK_DENOMINATIONS = [
    100000, // 100,000 kips
    50000,  // 50,000 kips
    20000,  // 20,000 kips
    10000,  // 10,000 kips
    5000,   // 5,000 kips
    2000,   // 2,000 kips
    1000,   // 1,000 kips
    500,    // 500 kips
] as const;

/**
 * Format amount as Laos Kips with proper thousand separators
 * @param amount - Amount in kips
 * @returns Formatted string (e.g., "50,000 ₭")
 */
export function formatLAK(amount: number): string {
    const rounded = Math.round(amount);
    return `${rounded.toLocaleString('en-US')} ₭`;
}

/**
 * Calculate change and suggest optimal banknote combination
 * @param total - Total amount to pay
 * @param received - Amount received from customer
 * @returns Change amount and suggested denominations
 */
export function calculateChange(total: number, received: number): {
    change: number;
    denominations: { value: number; count: number }[];
} {
    const change = Math.round(received - total);

    if (change <= 0) {
        return { change: 0, denominations: [] };
    }

    const denominations: { value: number; count: number }[] = [];
    let remaining = change;

    for (const denom of LAK_DENOMINATIONS) {
        if (remaining >= denom) {
            const count = Math.floor(remaining / denom);
            denominations.push({ value: denom, count });
            remaining -= count * denom;
        }
    }

    return { change, denominations };
}

/**
 * Suggest optimal banknote combination for a given amount
 * @param amount - Amount to suggest denominations for
 * @returns Array of denominations with counts
 */
export function suggestDenominations(amount: number): { value: number; count: number }[] {
    const rounded = Math.round(amount);
    const denominations: { value: number; count: number }[] = [];
    let remaining = rounded;

    for (const denom of LAK_DENOMINATIONS) {
        if (remaining >= denom) {
            const count = Math.floor(remaining / denom);
            denominations.push({ value: denom, count });
            remaining -= count * denom;
        }
    }

    return denominations;
}

/**
 * Calculate tax (10% VAT for Laos)
 * @param subtotal - Subtotal amount before tax
 * @returns Tax amount
 */
export function calculateTax(subtotal: number): number {
    return Math.round(subtotal * 0.1);
}

/**
 * Parse LAK string to number
 * @param lakString - String like "50,000 ₭" or "50000"
 * @returns Numeric value
 */
export function parseLAK(lakString: string): number {
    const cleaned = lakString.replace(/[,₭\s]/g, '');
    return parseInt(cleaned, 10) || 0;
}
