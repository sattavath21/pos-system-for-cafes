import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const endDate = searchParams.get('endDate') || new Date().toISOString()

        const db = await getDb()

        // 1. Revenue & Orders Trend (Daily)
        const dailyTrend = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', createdAt) as date,
                SUM(total) as revenue,
                COUNT(*) as orders
            FROM "Order"
            WHERE createdAt >= ? AND createdAt <= ? AND status = 'COMPLETED'
            GROUP BY date
            ORDER BY date ASC
        `, startDate, endDate)

        // 2. Category Share
        const categoryShare = await db.all(`
            SELECT 
                c.name as category,
                SUM(oi.total) as revenue,
                SUM(oi.quantity) as quantity
            FROM OrderItem oi
            JOIN Product p ON oi.productId = p.id
            JOIN Category c ON p.categoryId = c.id
            JOIN "Order" o ON oi.orderId = o.id
            WHERE o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'COMPLETED'
            GROUP BY c.name
            ORDER BY revenue DESC
        `, startDate, endDate)

        // 3. Hourly Sales (Heatmap)
        const hourlySales = await db.all(`
            SELECT 
                strftime('%H', createdAt) as hour,
                SUM(total) as revenue,
                COUNT(*) as orders
            FROM "Order"
            WHERE createdAt >= ? AND createdAt <= ? AND status = 'COMPLETED'
            GROUP BY hour
            ORDER BY hour ASC
        `, startDate, endDate)

        // 4. Payment Method Breakdown
        const paymentMethods = await db.all(`
            SELECT 
                paymentMethod,
                SUM(total) as revenue,
                COUNT(*) as orders
            FROM "Order"
            WHERE createdAt >= ? AND createdAt <= ? AND status = 'COMPLETED'
            GROUP BY paymentMethod
        `, startDate, endDate)

        // 5. Product Performance
        const topProducts = await db.all(`
            SELECT 
                oi.name,
                SUM(oi.quantity) as sold,
                SUM(oi.total) as revenue
            FROM OrderItem oi
            JOIN "Order" o ON oi.orderId = o.id
            WHERE o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'COMPLETED'
            GROUP BY oi.name
            ORDER BY sold DESC
            LIMIT 10
        `, startDate, endDate)

        const worstProducts = await db.all(`
            SELECT 
                p.name,
                COALESCE(SUM(oi.quantity), 0) as sold,
                COALESCE(SUM(oi.total), 0) as revenue
            FROM Product p
            LEFT JOIN OrderItem oi ON p.id = oi.productId
            LEFT JOIN "Order" o ON oi.orderId = o.id AND o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'COMPLETED'
            GROUP BY p.id
            ORDER BY sold ASC
            LIMIT 10
        `, startDate, endDate)

        const zeroSales = await db.all(`
            SELECT name, price
            FROM Product 
            WHERE id NOT IN (
                SELECT productId 
                FROM OrderItem oi
                JOIN "Order" o ON oi.orderId = o.id
                WHERE o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'COMPLETED'
            )
        `, startDate, endDate)

        // 6. Promotion Impact
        const promoImpact = await db.all(`
            SELECT 
                p.name,
                COUNT(o.id) as usageCount,
                SUM(o.discount) as totalDiscount,
                SUM(o.total) as totalRevenue
            FROM "Order" o
            JOIN Promotion p ON o.promoId = p.id
            WHERE o.createdAt >= ? AND o.createdAt <= ? AND o.status = 'COMPLETED'
            GROUP BY p.name
        `, startDate, endDate)

        // 7. Overall Stats (AOV, Total Rev, etc.)
        const summary = await db.get(`
            SELECT 
                SUM(total) as totalRevenue,
                COUNT(*) as totalOrders,
                AVG(total) as aov,
                SUM(discount) as totalDiscounts
            FROM "Order"
            WHERE createdAt >= ? AND createdAt <= ? AND status = 'COMPLETED'
        `, startDate, endDate)

        return NextResponse.json({
            dailyTrend,
            categoryShare,
            hourlySales,
            paymentMethods,
            topProducts,
            worstProducts,
            zeroSales,
            promoImpact,
            summary: {
                ...summary,
                periodCount: dailyTrend.length
            }
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
