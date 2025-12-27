import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, description, price, isAvailable, category } = body

        const db = await getDb()

        // Find or Create Category if provided
        let categoryId
        if (category) {
            const cat = await db.get('SELECT id FROM Category WHERE name = ?', category)
            if (cat) {
                categoryId = cat.id
            } else {
                const crypto = require('crypto')
                categoryId = crypto.randomUUID()
                await db.run('INSERT INTO Category (id, name) VALUES (?, ?)', categoryId, category)
            }
        }

        if (categoryId) {
            await db.run(
                'UPDATE Product SET name = ?, description = ?, price = ?, isAvailable = ?, categoryId = ? WHERE id = ?',
                name, description, price, isAvailable ? 1 : 0, categoryId, id
            )
        } else {
            await db.run(
                'UPDATE Product SET name = ?, description = ?, price = ?, isAvailable = ? WHERE id = ?',
                name, description, price, isAvailable ? 1 : 0, id
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const db = await getDb()
        await db.run('DELETE FROM Product WHERE id = ?', id)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
