import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
    try {
        const db = await getDb()
        const promotions = await db.all('SELECT * FROM Promotion ORDER BY createdAt DESC')
        return NextResponse.json(promotions)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const db = await getDb()
        const body = await request.json()
        const { name, description, code, discountType, discountValue, startDate, endDate, isActive } = body

        const id = crypto.randomUUID()
        const now = new Date().toISOString()

        await db.run(`
            INSERT INTO Promotion (
                id, name, description, code, discountType, discountValue, 
                startDate, endDate, isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, name, description, code, discountType, discountValue,
            startDate, endDate, isActive ? 1 : 0, now, now
        ])

        return NextResponse.json({ id, name, code })
    } catch (error: any) {
        console.error(error)
        if (error.message?.includes('UNIQUE constraint failed: Promotion.code')) {
            return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
    }
}
