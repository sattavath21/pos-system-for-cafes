import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { calculateInclusiveTax } from '@/lib/currency'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDateStr = searchParams.get('startDate')
        const endDateStr = searchParams.get('endDate')

        let startDate: Date
        let endDate: Date

        if (startDateStr) {
            startDate = new Date(startDateStr)
            if (isNaN(startDate.getTime())) {
                const [y, m, d] = startDateStr.split('-').map(Number)
                startDate = new Date(y, m - 1, d, 0, 0, 0, 0)
            } else if (!startDateStr.includes('T')) {
                startDate.setHours(0, 0, 0, 0)
            }
        } else {
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            startDate.setHours(0, 0, 0, 0)
        }

        if (endDateStr) {
            endDate = new Date(endDateStr)
            if (isNaN(endDate.getTime())) {
                const [y, m, d] = endDateStr.split('-').map(Number)
                endDate = new Date(y, m - 1, d, 23, 59, 59, 999)
            } else if (!endDateStr.includes('T')) {
                endDate.setHours(23, 59, 59, 999)
            }
        } else {
            endDate = new Date()
        }

        // 1. Daily Trend
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'COMPLETED',
                isReportable: true
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
                    status: 'COMPLETED',
                    isReportable: true
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
                status: 'COMPLETED',
                isReportable: true
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
            .slice(0, 5)

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
                isReportable: true,
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
                status: 'COMPLETED',
                isReportable: true
            },
            _sum: { total: true, discount: true, tax: true },
            _count: true,
            _avg: { total: true }
        })

        // Final verification check for the user in logs
        if ((summaryStats._count as any) === 0) {
            const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } })
            console.log("Analytics Diagnostic: No orders in range. Last order in DB:", lastOrder?.createdAt)
        }

        // Complimentary Orders Stats
        const complimentaryStats = await prisma.order.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
                isReportable: false
            },
            _sum: { total: true },
            _count: true
        })

        // Complimentary Orders by Customer
        const complimentaryOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
                isReportable: false,
                customerId: { not: null }
            },
            include: { customer: true }
        })

        const complimentaryMap = new Map()
        complimentaryOrders.forEach(o => {
            const name = o.customer?.name || "Unknown"
            if (!complimentaryMap.has(name)) {
                complimentaryMap.set(name, { customerName: name, orderCount: 0, totalValue: 0 })
            }
            const entry = complimentaryMap.get(name)
            entry.orderCount += 1
            entry.totalValue += o.total
        })
        const complimentaryDetails = Array.from(complimentaryMap.values()).sort((a, b) => b.totalValue - a.totalValue)

        // Customer Statistics
        const memberOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
                isReportable: true,
                customerId: { not: null }
            },
            select: { total: true, pointsRedeemed: true }
        })

        const guestOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
                isReportable: true,
                customerId: null
            },
            select: { total: true }
        })

        const memberVsGuest = [
            {
                type: "Member",
                count: memberOrders.length,
                revenue: memberOrders.reduce((sum, o) => sum + o.total, 0)
            },
            {
                type: "Guest",
                count: guestOrders.length,
                revenue: guestOrders.reduce((sum, o) => sum + o.total, 0)
            }
        ]

        // Top Loyalty Customers
        const topLoyalty = await prisma.customer.findMany({
            orderBy: { loyaltyPoints: 'desc' },
            take: 10,
            select: {
                name: true,
                loyaltyPoints: true,
                totalSpent: true,
                visitCount: true
            }
        })

        // Loyalty Points Stats
        const allCustomers = await prisma.customer.findMany({
            select: { loyaltyPoints: true }
        })
        const totalPointsEarned = allCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0)
        const totalPointsRedeemed = memberOrders.reduce((sum, o) => sum + (o.pointsRedeemed || 0), 0)
        const activeMembers = allCustomers.filter(c => c.loyaltyPoints > 0).length

        // Inventory Transaction Stats
        const inventoryTransactions = await prisma.stockTransaction.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            include: { ingredient: true },
            orderBy: { createdAt: 'desc' }
        })

        // Most Added to Warehouse (DEPOSIT transactions)
        const addedMap = new Map()
        inventoryTransactions
            .filter(t => t.type === 'DEPOSIT')
            .forEach(t => {
                const name = t.ingredient.name
                if (!addedMap.has(name)) {
                    addedMap.set(name, { name, quantity: 0, unit: t.ingredient.unit, transactions: 0 })
                }
                const entry = addedMap.get(name)
                entry.quantity += t.quantity
                entry.transactions += 1
            })
        const mostAdded = Array.from(addedMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10)

        // Most Transferred to Shop
        const transferMap = new Map()
        inventoryTransactions
            .filter(t => t.type === 'TRANSFER')
            .forEach(t => {
                const name = t.ingredient.name
                if (!transferMap.has(name)) {
                    transferMap.set(name, { name, quantity: 0, unit: t.ingredient.unit, transactions: 0 })
                }
                const entry = transferMap.get(name)
                entry.quantity += t.quantity
                entry.transactions += 1
            })
        const mostTransferred = Array.from(transferMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10)

        // Transaction type breakdown
        const transactionTypes = {
            transfers: inventoryTransactions.filter(t => t.type === 'TRANSFER').length,
            deposits: inventoryTransactions.filter(t => t.type === 'DEPOSIT').length,
            withdrawals: inventoryTransactions.filter(t => t.type === 'WITHDRAW').length,
            shopAdjustments: inventoryTransactions.filter(t => t.type === 'SHOP_ADJUST').length,
            usage: inventoryTransactions.filter(t => t.type === 'USAGE').length
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
            complimentaryDetails,
            customerStats: {
                memberVsGuest,
                topLoyalty,
                totalPointsEarned,
                totalPointsRedeemed,
                activeMembers
            },
            inventoryStats: {
                mostAdded,
                mostTransferred,
                transactionTypes,
                recentTransactions: inventoryTransactions.slice(0, 20).map(t => ({
                    id: t.id,
                    type: t.type,
                    ingredientName: t.ingredient.name,
                    quantity: t.quantity,
                    unit: t.ingredient.unit,
                    fromStore: t.fromStore,
                    toStore: t.toStore,
                    createdAt: t.createdAt
                }))
            },
            summary: {
                totalRevenue: summaryStats._sum?.total || 0,
                netSales: (summaryStats._sum?.total || 0) - (summaryStats._sum?.tax || 0),
                taxCollected: summaryStats._sum?.tax || 0,
                totalOrders: (summaryStats._count as any) || 0,
                aov: summaryStats._avg?.total || 0,
                totalDiscounts: summaryStats._sum?.discount || 0,
                periodCount: dailyTrend.length,
                complimentaryOrders: (complimentaryStats._count as any) || 0,
                complimentaryValue: complimentaryStats._sum?.total || 0
            }
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
