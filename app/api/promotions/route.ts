import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const promotions = await prisma.promotion.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(promotions)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, code, discountType, discountValue, startDate, endDate, isActive } = body

        const promotion = await prisma.promotion.create({
            data: {
                name,
                description,
                code,
                discountType,
                discountValue: parseFloat(discountValue),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: !!isActive
            }
        })

        return NextResponse.json(promotion)
    } catch (error: any) {
        console.error(error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
    }
}
