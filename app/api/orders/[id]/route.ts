import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const db = await getDb()

        // Fetch Order
        const order = await db.get('SELECT * FROM "Order" WHERE id = ?', id)
        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        // Fetch Items
        const items = await db.all('SELECT * FROM OrderItem WHERE orderId = ?', id)

        return NextResponse.json({ ...order, items })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}
