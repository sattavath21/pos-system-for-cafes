import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
        }

        const db = await getDb()

        // Fetch Orders
        const orders = await db.all(`
            SELECT * FROM "Order"
            WHERE createdAt >= ? AND createdAt <= ?
            ORDER BY createdAt DESC
        `, startDate, endDate)

        // Fetch Order Items
        const orderItems = await db.all(`
            SELECT oi.*, o.orderNumber, o.createdAt as orderDate
            FROM OrderItem oi
            JOIN "Order" o ON oi.orderId = o.id
            WHERE o.createdAt >= ? AND o.createdAt <= ?
            ORDER BY o.createdAt DESC
        `, startDate, endDate)

        // Create workbook
        const wb = XLSX.utils.book_new()

        // Orders Sheet
        const wsOrders = XLSX.utils.json_to_sheet(orders)
        XLSX.utils.book_append_sheet(wb, wsOrders, "Orders")

        // Items Sheet
        const wsItems = XLSX.utils.json_to_sheet(orderItems)
        XLSX.utils.book_append_sheet(wb, wsItems, "Order Items")

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buf, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="export_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.xlsx"`
            }
        })

    } catch (e) {
        console.error('Export error:', e)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}
