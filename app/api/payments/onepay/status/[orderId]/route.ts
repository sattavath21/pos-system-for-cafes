import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        /**
         * In a real implementation, this is where you would call the BCEL Inquiry API.
         * For this project, we assume the webhook is the primary source of truth,
         * but we provide the current status from the DB.
         */

        // Simulating a check - if it's already PAID in DB, return that.
        // If we had the BCEL API credentials, we would perform a real-time check here.

        return NextResponse.json({
            status: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            orderNumber: order.orderNumber
        });
    } catch (error) {
        console.error('Onepay Status Check Error:', error);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}
