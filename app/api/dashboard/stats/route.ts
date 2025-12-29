import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
    try {
        const db = await getDb()

        // 1. Time Ranges
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
        const endOfYesterday = startOfToday

        // 2. Today's Stats
        const todayStats = await db.get(`
            SELECT 
                SUM(total) as revenue, 
                COUNT(*) as count 
            FROM "Order" 
            WHERE createdAt >= ? AND status = 'COMPLETED'
        `, startOfToday)

        // 3. Yesterday's Stats (for comparison)
        const yesterdayStats = await db.get(`
            SELECT 
                SUM(total) as revenue, 
                COUNT(*) as count 
            FROM "Order" 
            WHERE createdAt >= ? AND createdAt < ? AND status = 'COMPLETED'
        `, startOfYesterday, endOfYesterday)

        // 4. Low Stock Count
        const lowStockCount = await db.get('SELECT COUNT(*) as count FROM Ingredient WHERE currentStock <= minStock')

        // 5. Active Orders
        const activeOrders = await db.all(`
            SELECT id, orderNumber, total, status, createdAt 
            FROM "Order" 
            WHERE status IN ('PENDING', 'PREPARING', 'READY', 'HOLD') 
            ORDER BY createdAt DESC 
            LIMIT 5
        `)

        // 6. Top Selling Items
        const topItems = await db.all(`
            SELECT name, SUM(quantity) as sold, SUM(total) as revenue 
            FROM OrderItem 
            GROUP BY name 
            ORDER BY sold DESC 
            LIMIT 5
        `)

        // 7. Low Stock Alerts (Detail)
        const lowStockAlerts = await db.all(`
            SELECT name, currentStock as current, unit, minStock as min 
            FROM Ingredient 
            WHERE currentStock <= minStock 
            LIMIT 10
        `)

        // Calculate changes
        const revChangeNum = yesterdayStats.revenue > 0
            ? ((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue * 100)
            : 100

        const countChangeNum = yesterdayStats.count > 0
            ? ((todayStats.count - yesterdayStats.count) / yesterdayStats.count * 100)
            : 100

        return NextResponse.json({
            summary: [
                {
                    title: "Today's Sales",
                    value: todayStats.revenue || 0,
                    change: `${revChangeNum >= 0 ? '+' : ''}${revChangeNum.toFixed(1)}%`,
                    type: "currency"
                },
                {
                    title: "Orders",
                    value: todayStats.count || 0,
                    change: `${countChangeNum >= 0 ? '+' : ''}${countChangeNum.toFixed(1)}%`,
                    type: "number"
                },
                {
                    title: "Avg Order Value",
                    value: todayStats.count > 0 ? (todayStats.revenue / todayStats.count) : 0,
                    change: "N/A",
                    type: "currency"
                },
                {
                    title: "Low Stock Items",
                    value: lowStockCount.count || 0,
                    change: "Alert",
                    type: "number"
                }
            ],
            activeOrders,
            topItems,
            lowStockAlerts
        })
    } catch (error) {
        console.error("Dashboard API Error:", error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
