/**
 * Onepay API Utility (BCEL)
 * Implements EMVco QR standard for Dynamic QR generation
 */

interface QROptions {
    merchantId: string;
    amount: number;
    billId: string;
    terminalId?: string;
    description?: string;
    currency?: string; // Default 418 (LAK)
}

/**
 * Format tag for EMVco QR: [Tag(2)][Length(2)][Value]
 */
function formatTag(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${tag}${length}${value}`;
}

/**
 * CRC16-CCITT (0xFFFF) Implementation
 */
function crc16(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function generateOnepayQR(options: QROptions): string {
    const {
        merchantId,
        amount,
        billId,
        terminalId = 'POS-01',
        description = 'Cafe Order',
        currency = '418'
    } = options;

    let qrParts = '';

    // 00: Payload Format Indicator
    qrParts += formatTag('00', '01');

    // 01: Point of Initiation Method (12 = Dynamic)
    qrParts += formatTag('01', '12');

    // 38: Merchant Account Information
    const merchantInfo =
        formatTag('00', 'A005266284662577') + // AID
        formatTag('01', '27710418') +        // IIN
        formatTag('02', '002') +             // Payment Type
        formatTag('03', merchantId);         // Merchant ID
    qrParts += formatTag('38', merchantInfo);

    // 52: Merchant Category Code
    qrParts += formatTag('52', '9987');

    // 53: Transaction Currency (418 = LAK)
    qrParts += formatTag('53', currency);

    // 54: Transaction Amount
    qrParts += formatTag('54', amount.toFixed(0));

    // 58: Country Code
    qrParts += formatTag('58', 'LA');

    // 60: Merchant City
    qrParts += formatTag('60', 'Vientiane');

    // 62: Additional Data Field
    const additionalData =
        formatTag('01', billId) +           // Bill Number
        formatTag('07', terminalId) +       // Terminal Label
        formatTag('08', description);      // Purpose of Transaction
    qrParts += formatTag('62', additionalData);

    // 63: CRC (Placeholder for initial calculation)
    qrParts += '6304';

    // Calculate CRC on whole string
    const finalCrc = crc16(qrParts);

    return qrParts + finalCrc;
}

/**
 * Mocking the Onepay Status Check (Poll)
 * In real-world, you'd fetch from BCEL API
 */
export async function checkOnepayStatus(billId: string) {
    // This would be a fetch call to BCEL API
    // For now, we assume the webhook will update the DB
    return null;
}
