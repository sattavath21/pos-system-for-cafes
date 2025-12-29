import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15
) {
    try {
        const { id } = await params
        const { status } = await request.json()

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'HOLD', 'CANCELLED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const db = await getDb()

        // Update status
        await db.run(
            'UPDATE "Order" SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            status, id
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }
}
