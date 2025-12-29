import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, unit, currentStock, minStock, maxStock, cost } = body

        const db = await getDb()

        await db.run(
            'UPDATE Ingredient SET name = ?, unit = ?, currentStock = ?, minStock = ?, maxStock = ?, cost = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            name, unit, currentStock, minStock, maxStock, cost, id
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const db = await getDb()
        await db.run('DELETE FROM Ingredient WHERE id = ?', id)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 })
    }
}
