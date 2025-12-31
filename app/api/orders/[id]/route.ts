import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const db = await getDb()

        const order = await db.get('SELECT * FROM "Order" WHERE id = ?', id)

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const items = await db.all('SELECT * FROM OrderItem WHERE orderId = ?', id)
        order.items = items

        const customer = order.customerId
            ? await db.get('SELECT * FROM Customer WHERE id = ?', order.customerId)
            : null
        order.customer = customer

        const promotion = order.promoId
            ? await db.get('SELECT * FROM Promotion WHERE id = ?', order.promoId)
            : null
        order.promotion = promotion

        return NextResponse.json(order)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}
