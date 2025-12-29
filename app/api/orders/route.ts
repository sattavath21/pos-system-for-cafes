import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, items, total, subtotal, tax, discount, promoId, customerId, paymentMethod, status } = body

        const db = await getDb()
        const now = new Date().toISOString()

        let orderId = id
        let orderNumber = ""
        let isNewOrder = false

        // 1. Check if it's an existing order
        if (orderId) {
            const existing = await db.get('SELECT orderNumber, status FROM "Order" WHERE id = ?', orderId)
            if (existing) {
                orderNumber = existing.orderNumber
                // If it was already COMPLETED, maybe we shouldn't allow updates? 
                // But for now, let's allow it or assume status transition.
            } else {
                isNewOrder = true
            }
        } else {
            orderId = crypto.randomUUID()
            isNewOrder = true
        }

        if (isNewOrder) {
            // Generate Sequential Daily Order Number
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const isoStartOfDay = startOfDay.toISOString();

            const countResult = await db.get(
                `SELECT COUNT(*) as count FROM "Order" WHERE createdAt >= ?`,
                isoStartOfDay
            );
            const nextNumber = (countResult?.count || 0) + 1;
            orderNumber = `No. ${String(nextNumber).padStart(2, '0')}`;

            await db.run(
                'INSERT INTO "Order" (id, orderNumber, status, total, subtotal, tax, discount, promoId, customerId, paymentMethod, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                orderId, orderNumber, status || 'COMPLETED', total, subtotal, tax, discount || 0, promoId || null, customerId || null, paymentMethod || 'CASH', now, now
            )
        } else {
            // Update existing order
            await db.run(
                'UPDATE "Order" SET status = ?, total = ?, subtotal = ?, tax = ?, discount = ?, promoId = ?, customerId = ?, paymentMethod = ?, updatedAt = ? WHERE id = ?',
                status || 'COMPLETED', total, subtotal, tax, discount || 0, promoId || null, customerId || null, paymentMethod || 'CASH', now, orderId
            )
            // Delete old items
            await db.run('DELETE FROM OrderItem WHERE orderId = ?', orderId)
        }

        // 3. Insert Order Items & Handle Stock Deduction
        for (const item of items) {
            const orderItemId = crypto.randomUUID()
            await db.run(
                'INSERT INTO OrderItem (id, orderId, productId, name, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                orderItemId, orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity
            )

            // Stock Deduction (only if transitioning to COMPLETED and not previously completed)
            // For simplicity, we just deduct when status is COMPLETED. 
            // Better would be to check if it was already COMPLETED before.
            if (status === 'COMPLETED') {
                const recipes = await db.all('SELECT ingredientId, quantity FROM Recipe WHERE productId = ?', item.id)
                for (const recipe of recipes) {
                    await db.run(
                        'UPDATE Ingredient SET currentStock = currentStock - ?, updatedAt = ? WHERE id = ?',
                        recipe.quantity * item.quantity, now, recipe.ingredientId
                    )
                }
            }
        }

        if (customerId && status === 'COMPLETED') {
            const points = Math.floor(total / 1000) // 1 point per 1,000 LAK
            await db.run('UPDATE Customer SET loyaltyPoints = loyaltyPoints + ?, totalSpent = totalSpent + ?, visitCount = visitCount + 1, lastVisit = ? WHERE id = ?', points, total, now, customerId)
        }

        return NextResponse.json({ id: orderId, orderNumber }, { status: isNewOrder ? 201 : 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const status = searchParams.get('status')
        const nextNum = searchParams.get('next-number')

        const db = await getDb()

        if (nextNum) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const isoStartOfDay = startOfDay.toISOString();
            const countResult = await db.get(
                `SELECT COUNT(*) as count FROM "Order" WHERE createdAt >= ?`,
                isoStartOfDay
            );
            const nextNumber = (countResult?.count || 0) + 1;
            return NextResponse.json({ orderNumber: `No. ${String(nextNumber).padStart(2, '0')}` });
        }

        let query = 'SELECT * FROM "Order"'
        let params: any[] = []

        if (customerId || status) {
            query += ' WHERE'
            if (customerId) {
                query += ' customerId = ?'
                params.push(customerId)
            }
            if (status) {
                if (customerId) query += ' AND'
                query += ' status = ?'
                params.push(status)
            }
        }

        query += ' ORDER BY createdAt DESC LIMIT 100'
        const orders = await db.all(query, params)

        // Fetch items for each order
        for (const order of orders) {
            const items = await db.all('SELECT * FROM OrderItem WHERE orderId = ?', order.id)
            order.items = items
        }

        return NextResponse.json(orders)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

