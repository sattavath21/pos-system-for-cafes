import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Onepay Webhook Received:', JSON.stringify(body, null, 2));

        // SECURITY: Verify token from BCEL
        const token = request.headers.get('X-Webhook-Token');
        if (process.env.WEBHOOK_SECRET && token !== process.env.WEBHOOK_SECRET) {
            console.warn('Unauthorized webhook attempt: invalid token');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
            // Acknowledge anyway to stop retries if appropriate, or return 404
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

        // BCEL One expects specific response codes
        return NextResponse.json({
            res_code: '00',
            res_desc: 'Success'
        });
    } catch (error) {
        console.error('Onepay Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
