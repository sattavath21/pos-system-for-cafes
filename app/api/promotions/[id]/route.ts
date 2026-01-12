import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const db = await getDb()
        const body = await request.json()
        const { name, description, code, discountType, discountValue, startDate, endDate, isActive } = body

        const now = new Date().toISOString()

        await db.run(`
            UPDATE Promotion SET
                name = ?, description = ?, code = ?, discountType = ?, 
                discountValue = ?, startDate = ?, endDate = ?, 
                isActive = ?, updatedAt = ?
            WHERE id = ?
        `, [
            name, description, code, discountType,
            discountValue, startDate, endDate,
            isActive ? 1 : 0, now, id
        ])

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error(error)
        if (error.message?.includes('UNIQUE constraint failed: Promotion.code')) {
            return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
    }
}
