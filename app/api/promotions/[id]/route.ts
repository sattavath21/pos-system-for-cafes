import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, description, code, discountType, discountValue, startDate, endDate, isActive } = body

        await prisma.promotion.update({
            where: { id },
            data: {
                name,
                description,
                code,
                discountType,
                discountValue: parseFloat(discountValue.toString()),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive ?? true
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error(error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
    }
}
