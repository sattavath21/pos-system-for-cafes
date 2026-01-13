import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            id, items, total, subtotal, tax, discount,
            promoId, customerId, paymentMethod, status,
            beeperNumber, cancellationReason
        } = body

        // Validate status
        const validStatuses = ['COMPLETED', 'HOLD', 'CANCELLED']
        const orderStatus = validStatuses.includes(status) ? status : 'COMPLETED'

        let order

        // Transaction to ensure data integrity
        await prisma.$transaction(async (tx: any) => {
            // 1. Handle Order Number
            let orderNumber = ""
            let isNew = false

            if (id) {
                const existing = await tx.order.findUnique({ where: { id } })
                if (existing) {
                    orderNumber = existing.orderNumber
                } else {
                    isNew = true
                }
            } else {
                isNew = true
            }

            if (isNew) {
                const today = startOfDay(new Date())
                const count = await tx.order.count({
                    where: { createdAt: { gte: today } }
                })
                orderNumber = `No. ${String(count + 1).padStart(2, '0')}`
            }

            // 2. Upsert Order
            const orderId = id || crypto.randomUUID()

            // Prepare order data (without relation IDs)
            const orderData = {
                orderNumber,
                status: orderStatus,
                total, subtotal, tax, discount: discount || 0,
                paymentMethod: paymentMethod || 'CASH',
                beeperNumber: beeperNumber || null,
                cancellationReason: status === 'CANCELLED' ? cancellationReason : null
            }

            // Prepare relation connects
            const relationData: any = {}
            if (promoId) {
                const promoExists = await tx.promotion.findUnique({ where: { id: promoId } })
                if (promoExists) {
                    relationData.promotion = { connect: { id: promoId } }
                }
            }
            if (customerId) {
                // Check if customer exists before connecting
                const customerExists = await tx.customer.findUnique({ where: { id: customerId } })
                if (customerExists) {
                    relationData.customer = { connect: { id: customerId } }
                }
            }

            // Prepare validated items
            const preparedItems = []
            for (const item of items) {
                let pid = null
                if (item.id) {
                    const product = await tx.product.findUnique({ where: { id: item.id } })
                    if (product) pid = item.id
                }
                preparedItems.push({
                    productId: pid,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })
            }

            if (isNew) {
                order = await tx.order.create({
                    data: {
                        id: orderId,
                        ...orderData,
                        ...relationData,
                        items: {
                            create: preparedItems
                        }
                    }
                })
            } else {
                // Update: Delete old items and re-create (simplest strategy)
                await tx.orderItem.deleteMany({ where: { orderId } })

                // For update, handle disconnect if IDs are null
                const updateRelations: any = {}
                if (promoId) {
                    const promoExists = await tx.promotion.findUnique({ where: { id: promoId } })
                    if (promoExists) {
                        updateRelations.promotion = { connect: { id: promoId } }
                    } else {
                        updateRelations.promotion = { disconnect: true }
                    }
                } else {
                    updateRelations.promotion = { disconnect: true }
                }
                if (customerId) {
                    const customerExists = await tx.customer.findUnique({ where: { id: customerId } })
                    if (customerExists) {
                        updateRelations.customer = { connect: { id: customerId } }
                    } else {
                        updateRelations.customer = { disconnect: true }
                    }
                } else {
                    updateRelations.customer = { disconnect: true }
                }

                order = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        ...orderData,
                        ...updateRelations,
                        items: {
                            create: preparedItems
                        }
                    }
                })
            }

            // 3. Stock Deduction (Only if COMPLETED)
            if (orderStatus === 'COMPLETED') {
                for (const item of items) {
                    const recipes = await tx.recipe.findMany({
                        where: { productId: item.id }
                    })

                    for (const recipe of recipes) {
                        await tx.ingredient.update({
                            where: { id: recipe.ingredientId },
                            data: {
                                currentStock: { decrement: recipe.quantity * item.quantity }
                            }
                        })
                    }
                }

                // 4. Loyalty Points
                if (customerId) {
                    const points = Math.floor(total / 1000)
                    await tx.customer.update({
                        where: { id: customerId },
                        data: {
                            loyaltyPoints: { increment: points },
                            totalSpent: { increment: total },
                            visitCount: { increment: 1 },
                            lastVisit: new Date()
                        }
                    })
                }

                // 5. Update Cash Drawer (Shift) if Cash Payment
                if (paymentMethod === 'BANK_NOTE') { // Map generic generic 'CASH' to 'BANK_NOTE' if needed, or use 'CASH' if that's the enum
                    // NOTE: The frontend sends 'BANK_NOTE' for cash usually
                    const openShift = await tx.shift.findFirst({
                        where: { status: 'OPEN' }
                    })

                    if (openShift) {
                        await tx.shift.update({
                            where: { id: openShift.id },
                            data: {
                                cashPayments: { increment: total }
                            }
                        })
                    }
                }
            }
        })

        return NextResponse.json(order)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const nextNum = searchParams.get('next-number')

    try {
        if (nextNum) {
            const today = startOfDay(new Date())
            const count = await prisma.order.count({
                where: { createdAt: { gte: today } }
            })
            return NextResponse.json({ orderNumber: `No. ${String(count + 1).padStart(2, '0')}` })
        }

        const where: any = {}
        if (customerId) where.customerId = customerId
        if (status) where.status = status

        const orders = await prisma.order.findMany({
            where,
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        return NextResponse.json(orders)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

