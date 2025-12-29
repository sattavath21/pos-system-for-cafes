import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const db = await getDb()

        // Update order status to HOLD
        await db.run(
            'UPDATE "Order" SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            'HOLD', id
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to hold order' }, { status: 500 })
    }
}
