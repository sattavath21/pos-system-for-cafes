import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOnepayQR } from '@/lib/onepay';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Get Merchant ID from env or fallback for development
        const merchantId = process.env.ONEPAY_MERCHANT_ID || 'mch5949fa044ed9d';

        // Generate QR Data
        const qrData = generateOnepayQR({
            merchantId: merchantId,
            amount: order.total,
            billId: order.orderNumber,
            description: `Order ${order.orderNumber}`
        });

        // Update order with QR data
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                qrCodeData: qrData,
                paymentStatus: 'PENDING'
            }
        });

        return NextResponse.json({
            qrCode: qrData,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Onepay Generate Error:', error);
        return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
    }
}
