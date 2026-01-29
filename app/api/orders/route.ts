import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

// Force dynamic to prevent caching issues with Orders
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            id, items, total, subtotal, tax, discount,
            promoId, customerId, paymentMethod, status,
            beeperNumber, cancellationReason,
            pointsRedeemed, taxAmount, isReportable
        } = body

        // --- VALIDATION PHASE (Fail Fast) ---

        // 1. Validate Items & VariationSizes
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Order must have items' }, { status: 400 })
        }

        // Extract variationSizeIds from items
        const variationSizeIds = Array.from(new Set(items.map((i: any) => i.variationSizeId)))
            .filter(id => id !== undefined && id !== null) as string[]

        if (variationSizeIds.length === 0) {
            return NextResponse.json({ error: 'Items must have variationSizeId' }, { status: 400 })
        }

        // Check if ALL referenced variationSizes exist in DB
        const existingVariationSizes = await prisma.variationSize.findMany({
            where: { id: { in: variationSizeIds } },
            select: { id: true, price: true, size: true, variation: { select: { type: true, menu: { select: { name: true } } } } }
        })

        const existingVariationSizeIds = new Set(existingVariationSizes.map(vs => vs.id))
        const missingIds = variationSizeIds.filter(id => !existingVariationSizeIds.has(id))

        if (missingIds.length > 0) {
            console.error("Order Validation Failed: Stale IDs detected", missingIds)
            return NextResponse.json({
                error: `Foreign Key Violation: VariationSizes with IDs [${missingIds.join(', ')}] do not exist. Please refresh the menu or clear your cart.`,
                code: 'STALE_ID_VIOLATION',
                missingIds
            }, { status: 400 })
        }

        // 2. Validate Customer (if provided)
        if (customerId) {
            const customer = await prisma.customer.findUnique({ where: { id: customerId } })
            if (!customer) {
                return NextResponse.json({
                    error: `Customer ${customerId} not found. They may have been deleted or the database was re-seeded.`,
                    code: 'STALE_CUSTOMER_VIOLATION'
                }, { status: 400 })
            }
        }

        // 3. Validate Promotion (if provided)
        if (promoId) {
            const promo = await prisma.promotion.findUnique({ where: { id: promoId } })
            if (!promo) {
                return NextResponse.json({ error: `Promotion ${promoId} not found` }, { status: 400 })
            }
        }

        // 4. Validate Shift (Only if COMPLETED + CASH)
        let openShiftId: string | null = null
        if (status === 'COMPLETED' && (paymentMethod === 'BANK_NOTE' || paymentMethod === 'CASH')) {
            const openShift = await prisma.shift.findFirst({ where: { status: 'OPEN' } })
            if (openShift) {
                openShiftId = openShift.id
                console.log("Found open shift:", openShiftId)
            } else {
                console.log("No open shift found for cash payment!")
            }
        }

        // --- EXECUTION PHASE (Transaction) ---

        const result = await prisma.$transaction(async (tx) => {
            // 1. Determine Order Number
            let orderNumber = ""
            let isNew = false
            const orderId = id || crypto.randomUUID()

            // Fetch previous state if exists
            const previousOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            })

            if (previousOrder) {
                orderNumber = previousOrder.orderNumber
            } else {
                isNew = true
                const today = startOfDay(new Date())
                const count = await tx.order.count({
                    where: { createdAt: { gte: today } }
                })
                orderNumber = `No. ${String(count + 1).padStart(2, '0')}`
            }

            // 2. Prepare Payload
            const orderData = {
                orderNumber,
                status: status || 'COMPLETED',
                total: parseFloat(total),
                subtotal: parseFloat(subtotal),
                tax: parseFloat(taxAmount || tax || 0),
                discount: parseFloat(discount || 0),
                paymentMethod: paymentMethod || 'BANK_NOTE',
                beeperNumber: beeperNumber || null,
                cancellationReason: status === 'CANCELLED' ? cancellationReason : null,
                pointsRedeemed: pointsRedeemed ? parseInt(pointsRedeemed) : 0,
                isReportable: isReportable !== undefined ? isReportable : true,
                updatedAt: new Date()
            }

            // 3. Prepare Items (using variationSizeId)
            const preparedItems = items.map((item: any) => {
                // 1. Find the DB record for this variationSize
                const vsRecord = existingVariationSizes.find(v => v.id === item.variationSizeId);
                const dbVariation = vsRecord?.variation?.type; // e.g. "Hot"
                const dbSize = vsRecord?.size; // e.g. "M"

                // 2. Resolve Variation & Size (trust payload, fallback to DB)
                const finalVariation = item.variation || dbVariation;
                const finalSize = item.size || item.cupSize || dbSize;

                // 3. Construct full descriptive name snapshot
                // Base: "Latte" -> Result: "Latte (Hot) - M"
                let fullName = item.name || vsRecord?.variation?.menu?.name || "Item";

                // Only add if not already present in the string
                if (finalVariation && !fullName.includes(`(${finalVariation})`)) {
                    // Remove any existing brackets if we are rebuilding
                    fullName = fullName.replace(/\s*\([^)]*\)/, '');
                    fullName = `${fullName} (${finalVariation})`;
                }
                if (finalSize && !fullName.includes(`- ${finalSize}`)) {
                    // Remove any existing dashes if we are rebuilding
                    fullName = fullName.split(' - ')[0];
                    fullName = `${fullName} - ${finalSize}`;
                }

                return {
                    variationSizeId: item.variationSizeId,
                    name: fullName,
                    price: parseFloat(item.price),
                    quantity: parseInt(item.quantity),
                    total: parseFloat((item.price * item.quantity).toString()),
                    sugarLevel: item.sugarLevel || null,
                    shotType: item.shotType || null,
                    cupSize: finalSize || null
                }
            })

            // 4. Update/Create Order
            let savedOrder;
            if (isNew) {
                savedOrder = await tx.order.create({
                    data: {
                        id: orderId,
                        ...orderData,
                        customer: customerId ? { connect: { id: customerId } } : undefined,
                        promotion: promoId ? { connect: { id: promoId } } : undefined,
                        items: {
                            create: preparedItems
                        }
                    }
                })
            } else {
                // Delete existing items to replace with new set
                await tx.orderItem.deleteMany({ where: { orderId } })

                savedOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        ...orderData,
                        customer: customerId ? { connect: { id: customerId } } : { disconnect: true },
                        promotion: promoId ? { connect: { id: promoId } } : { disconnect: true },
                        items: {
                            create: preparedItems
                        }
                    }
                })
            }

            // --- BUSINESS LOGIC (Stock, Loyalty, Cash) ---
            // Only trigger if status is COMPLETED

            const wasCompleted = previousOrder?.status === 'COMPLETED'
            const isNowCompleted = status === 'COMPLETED'
            const isCancelled = status === 'CANCELLED'

            // A. If newly COMPLETED (new order OR updated from HOLD -> COMPLETED)
            if (isNowCompleted && !wasCompleted) {

                // 1. Deduct Stock (based on menu recipes)
                for (const item of preparedItems) {
                    // Get the menu from variationSize
                    const vs = await tx.variationSize.findUnique({
                        where: { id: item.variationSizeId },
                        include: { variation: { include: { menu: true } } }
                    })

                    if (vs?.variation?.menu) {
                        const recipes = await tx.recipe.findMany({ where: { menuId: vs.variation.menu.id } })
                        for (const recipe of recipes) {
                            await tx.ingredient.update({
                                where: { id: recipe.ingredientId },
                                data: { subStock: { decrement: recipe.quantity * item.quantity } }
                            })
                        }
                    }
                }

                // 2. Add Loyalty (if customer)
                if (customerId) {
                    const earned = Math.floor(savedOrder.total / 1000)
                    const redeemed = savedOrder.pointsRedeemed || 0

                    await tx.customer.update({
                        where: { id: customerId },
                        data: {
                            loyaltyPoints: { increment: earned - redeemed },
                            totalSpent: { increment: savedOrder.total },
                            visitCount: { increment: 1 },
                            lastVisit: new Date()
                        }
                    })
                }

                // 3. Update Cash Drawer (if Cash & Open Shift exists)
                if ((paymentMethod === 'BANK_NOTE' || paymentMethod === 'CASH') && openShiftId) {
                    await tx.shift.update({
                        where: { id: openShiftId },
                        data: { cashPayments: { increment: savedOrder.total } }
                    })
                }
            }

            // B. If REVERSAL (COMPLETED -> CANCELLED)
            if (wasCompleted && isCancelled) {
                // 1. Revert Stock
                const oldItems = previousOrder.items
                for (const item of oldItems) {
                    if (!item.variationSizeId) continue
                    const vs = await tx.variationSize.findUnique({
                        where: { id: item.variationSizeId },
                        include: { variation: { include: { menu: true } } }
                    })

                    if (vs?.variation?.menu) {
                        const recipes = await tx.recipe.findMany({ where: { menuId: vs.variation.menu.id } })
                        for (const recipe of recipes) {
                            await tx.ingredient.update({
                                where: { id: recipe.ingredientId },
                                data: { subStock: { increment: recipe.quantity * item.quantity } }
                            })
                        }
                    }
                }

                // 2. Revert Loyalty
                if (previousOrder.customerId) {
                    const earned = Math.floor(previousOrder.total / 1000)
                    const redeemed = previousOrder.pointsRedeemed || 0

                    await tx.customer.update({
                        where: { id: previousOrder.customerId },
                        data: {
                            loyaltyPoints: { decrement: earned - redeemed },
                            totalSpent: { decrement: previousOrder.total },
                            visitCount: { decrement: 1 }
                        }
                    })
                }

                // 3. Revert Cash
                if (previousOrder.paymentMethod === 'BANK_NOTE' || previousOrder.paymentMethod === 'CASH') {
                    const shift = await tx.shift.findFirst({ where: { status: 'OPEN' } })
                    if (shift) {
                        await tx.shift.update({
                            where: { id: shift.id },
                            data: { cashPayments: { decrement: previousOrder.total } }
                        })
                    }
                }
            }

            return savedOrder
        })

        return NextResponse.json(result)

    } catch (error: any) {
        console.error("Order Transaction Failed:", error)
        return NextResponse.json({
            error: error.message || 'Transaction failed',
            details: error.meta
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const nextNum = searchParams.get('next-number')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

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
