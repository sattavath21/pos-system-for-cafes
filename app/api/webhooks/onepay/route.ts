import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Onepay Webhook Received:', JSON.stringify(body, null, 2));

        /**
         * Expected BCEL Onepay Webhook Payload (Typical Structure)
         * {
         *   "bill_id": "ORDER-0001",
         *   "transaction_id": "BCEL-123456",
         *   "amount": 25000,
         *   "currency": "LAK",
         *   "status": "SUCCESS"
         * }
         */

        const { bill_id, transaction_id, status } = body;

        if (!bill_id) {
            return NextResponse.json({ error: 'Missing bill_id' }, { status: 400 });
        }

        // Find the order by orderNumber (bill_id)
        const order = await prisma.order.findFirst({
            where: { orderNumber: bill_id }
        });

        if (!order) {
            console.warn(`Webhook received for unknown order: ${bill_id}`);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (status === 'SUCCESS' || status === 'paid' || status === 'COMPLETED') {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: 'PAID',
                    bankReference: transaction_id || null,
                    paymentMethod: 'ONEPAY'
                }
            });
            console.log(`Order ${bill_id} marked as PAID via Webhook.`);
        } else {
            console.log(`Payment status for order ${bill_id} is not success: ${status}`);
        }

        // BCEL usually expects a specific JSON response to acknowledge receipt
        return NextResponse.json({
            res_code: '00',
            res_desc: 'Success'
        });
    } catch (error) {
        console.error('Onepay Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
