import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { items, total, subtotal, tax, customerId, paymentMethod, status } = body

        // items: [{ id, name, price, quantity }]

        const db = await getDb()
        const crypto = require('crypto');
        const orderId = crypto.randomUUID()

        // Generate simple order number (e.g., current time suffix)
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

        await db.run(
            'INSERT INTO "Order" (id, orderNumber, status, total, subtotal, tax, customerId, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            orderId, orderNumber, status || 'COMPLETED', total, subtotal, tax, customerId, paymentMethod || 'CASH'
        )

        // Insert Order Items
        for (const item of items) {
            // Warning: item.id refers to Product ID here.
            const orderItemId = crypto.randomUUID()
            await db.run(
                'INSERT INTO OrderItem (id, orderId, productId, name, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                orderItemId, orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity
            )
            // Optionally update loyalty points for customer if exists
            // simplified...
        }

        if (customerId && status === 'COMPLETED') {
            // Update customer stats
            const points = Math.floor(total) // 1 point per $1
            await db.run('UPDATE Customer SET loyaltyPoints = loyaltyPoints + ?, totalSpent = totalSpent + ?, visitCount = visitCount + 1, lastVisit = CURRENT_TIMESTAMP WHERE id = ?', points, total, customerId)
        }

        return NextResponse.json({ id: orderId, orderNumber }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    // For reports or history
    try {
        const db = await getDb()
        const orders = await db.all('SELECT * FROM "Order" ORDER BY createdAt DESC LIMIT 100')
        return NextResponse.json(orders)
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
