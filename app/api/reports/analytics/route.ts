import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { calculateInclusiveTax } from '@/lib/currency'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDateStr = searchParams.get('startDate')
        const endDateStr = searchParams.get('endDate')

        const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = endDateStr ? new Date(endDateStr) : new Date()

        // 1. Daily Trend
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'COMPLETED'
            },
            select: {
                total: true,
                createdAt: true,
                discount: true
            }
        })

        console.log(`Analytics: Found ${orders.length} orders between ${startDate.toISOString()} and ${endDate.toISOString()}`)

        const trendMap = new Map()
        orders.forEach(o => {
            const date = o.createdAt.toISOString().split('T')[0]
            if (!trendMap.has(date)) trendMap.set(date, { date, revenue: 0, orders: 0 })
            const entry = trendMap.get(date)
            entry.revenue += o.total
            entry.orders += 1
        })
        const dailyTrend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        // 2. Category Share
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startDate, lte: endDate },
                    status: 'COMPLETED'
                }
            },
            include: {
                variationSize: {
                    include: {
                        variation: {
                            include: {
                                menu: {
                                    include: { category: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        const categoryMap = new Map()
        orderItems.forEach(item => {
            const catName = item.variationSize?.variation.menu.category.name || "Other"

            if (!categoryMap.has(catName)) categoryMap.set(catName, { category: catName, revenue: 0, quantity: 0 })
            const entry = categoryMap.get(catName)
            entry.revenue += item.total
            entry.quantity += item.quantity
        })
        const categoryShare = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)

        // 3. Hourly Sales
        const hourMap = new Map()
        orders.forEach(o => {
            const hour = o.createdAt.getHours().toString().padStart(2, '0')
            if (!hourMap.has(hour)) hourMap.set(hour, { hour, revenue: 0, orders: 0 })
            const entry = hourMap.get(hour)
            entry.revenue += o.total
            entry.orders += 1
        })
        const hourlySales = Array.from(hourMap.values()).sort((a, b) => a.hour.localeCompare(b.hour))

        // 4. Payment Methods
        const payMap = new Map()
        const methodOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
            },
            select: { paymentMethod: true, total: true, discount: true }
        })
        methodOrders.forEach(o => {
            const m = o.paymentMethod || "CASH"
            if (!payMap.has(m)) payMap.set(m, { paymentMethod: m, revenue: 0, orders: 0 })
            const entry = payMap.get(m)
            entry.revenue += o.total
            entry.orders += 1
        })
        const paymentMethods = Array.from(payMap.values())

        // 5. Product Performance (Refined Grouping)
        const bestSellerMap = new Map()
        const lowPerfMap = new Map()

        orderItems.forEach(item => {
            const vs = item.variationSize
            const menuName = vs?.variation.menu.name || item.name.split(' - ')[0]
            const varType = vs?.variation.type || ""

            // Best Seller Key: Menu + Variation (e.g., Latte (COLD))
            const bestSellerKey = `${menuName} (${varType})`
            if (!bestSellerMap.has(bestSellerKey)) {
                bestSellerMap.set(bestSellerKey, { name: bestSellerKey, productName: menuName, variantType: varType, sold: 0, revenue: 0 })
            }
            const bsEntry = bestSellerMap.get(bestSellerKey)
            bsEntry.sold += item.quantity
            bsEntry.revenue += item.total

            // Low Performance Key: Menu only (e.g., Latte)
            const lowPerfKey = menuName
            if (!lowPerfMap.has(lowPerfKey)) {
                lowPerfMap.set(lowPerfKey, { name: lowPerfKey, sold: 0, revenue: 0 })
            }
            const lpEntry = lowPerfMap.get(lowPerfKey)
            lpEntry.sold += item.quantity
            lpEntry.revenue += item.total
        })

        const topProducts = Array.from(bestSellerMap.values())
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10)

        const worstProducts = Array.from(lowPerfMap.values())
            .filter(p => p.sold > 0)
            .sort((a, b) => a.sold - b.sold)
            .slice(0, 5)

        // Zero Sales / Trash Items: Count by Menu
        const allMenus = await prisma.menu.findMany({
            include: {
                variations: {
                    include: { sizes: true }
                }
            }
        })

        const soldMenuNames = new Set(Array.from(lowPerfMap.keys()))
        const trashItems = allMenus
            .filter(m => !soldMenuNames.has(m.name))
            .map(m => ({
                name: m.name,
                price: 0 // Price varies by variation/size
            }))

        // 6. Size & Variation Type Stats
        const sizeMap = new Map()
        const varTypeMap = new Map()

        orderItems.forEach(item => {
            const vs = item.variationSize
            const size = vs?.size || "Unknown"
            const type = vs?.variation.type || "Other"

            if (!sizeMap.has(size)) sizeMap.set(size, { name: size, sold: 0, revenue: 0 })
            const sEntry = sizeMap.get(size)
            sEntry.sold += item.quantity
            sEntry.revenue += item.total

            if (!varTypeMap.has(type)) varTypeMap.set(type, { name: type, sold: 0, revenue: 0 })
            const vEntry = varTypeMap.get(type)
            vEntry.sold += item.quantity
            vEntry.revenue += item.total
        })

        const sizeStats = Array.from(sizeMap.values()).sort((a, b) => b.sold - a.sold)
        const variationStats = Array.from(varTypeMap.values()).sort((a, b) => b.sold - a.sold)

        // 6. Promo Impact
        const promoOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
                promoId: { not: null }
            },
            include: { promotion: true }
        })
        const promoMap = new Map()
        promoOrders.forEach(o => {
            const name = o.promotion?.name || "Unknown"
            if (!promoMap.has(name)) promoMap.set(name, { name, usageCount: 0, totalDiscount: 0, totalRevenue: 0 })
            const entry = promoMap.get(name)
            entry.usageCount += 1
            entry.totalDiscount += o.discount
            entry.totalRevenue += o.total
        })
        const promoImpact = Array.from(promoMap.values())

        // 7. Summary
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
        const totalOrders = orders.length
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0
        const totalDiscounts = methodOrders.reduce((sum, o) => sum + (o as any).discount || 0, 0) // We need discount in fetch

        // Summary Stats (robustified)
        const summaryStats = await prisma.order.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
            },
            _sum: { total: true, discount: true, tax: true },
            _count: true,
            _avg: { total: true }
        })

        // Final verification check for the user in logs
        if (summaryStats._count === 0) {
            const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } })
            console.log("Analytics Diagnostic: No orders in range. Last order in DB:", lastOrder?.createdAt)
        }

        return NextResponse.json({
            dailyTrend,
            categoryShare,
            hourlySales,
            paymentMethods,
            topProducts,
            worstProducts,
            zeroSales: trashItems,
            sizeStats,
            variationStats,
            promoImpact,
            summary: {
                totalRevenue: summaryStats._sum.total || 0,
                netSales: (summaryStats._sum.total || 0) - (summaryStats._sum.tax || 0),
                taxCollected: summaryStats._sum.tax || 0,
                totalOrders: summaryStats._count || 0,
                aov: summaryStats._avg.total || 0,
                totalDiscounts: summaryStats._sum.discount || 0,
                periodCount: dailyTrend.length
            }
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
