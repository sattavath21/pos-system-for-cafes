import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        // const from = searchParams.get('from')
        // const to = searchParams.get('to')

        // For now, let's just return key metrics for the last 30 days
        const db = await getDb()

        // Total Sales Today
        const today = new Date().toISOString().split('T')[0]
        const todaySales = await db.get('SELECT SUM(total) as total, COUNT(*) as count FROM "Order" WHERE date(createdAt) = ?', today)

        // Sales by Day (Chart) - Last 7 days
        const dailySales = await db.all(`
        SELECT date(createdAt) as date, SUM(total) as total 
        FROM "Order" 
        WHERE createdAt >= date('now', '-7 days') 
        GROUP BY date(createdAt) 
        ORDER BY date(createdAt)
    `)

        // Top Products (Joined with OrderItem)
        const topProducts = await db.all(`
        SELECT name, SUM(quantity) as quantity, SUM(total) as revenue 
        FROM OrderItem 
        GROUP BY name 
        ORDER BY quantity DESC 
        LIMIT 5
    `)

        return NextResponse.json({
            today: { total: todaySales.total || 0, orders: todaySales.count || 0 },
            dailySales,
            topProducts
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
