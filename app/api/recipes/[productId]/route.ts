import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const db = await getDb()
        const recipe = await db.all(`
            SELECT r.*, i.name as ingredientName, i.unit 
            FROM Recipe r
            JOIN Ingredient i ON r.ingredientId = i.id
            WHERE r.productId = ?
        `, productId)
        return NextResponse.json(recipe)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const { ingredientId, quantity } = await request.json()

        if (!ingredientId || !quantity) {
            return NextResponse.json({ error: 'Ingredient and quantity are required' }, { status: 400 })
        }

        const db = await getDb()
        const crypto = require('crypto')
        const id = crypto.randomUUID()
        const now = new Date().toISOString()

        await db.run(`
            INSERT INTO Recipe (id, productId, ingredientId, quantity, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(productId, ingredientId) DO UPDATE SET
                quantity = excluded.quantity,
                updatedAt = excluded.updatedAt
        `, id, productId, ingredientId, quantity, now, now)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const { searchParams } = new URL(request.url)
        const ingredientId = searchParams.get('ingredientId')

        if (!ingredientId) {
            return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 })
        }

        const db = await getDb()
        await db.run('DELETE FROM Recipe WHERE productId = ? AND ingredientId = ?', productId, ingredientId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to remove ingredient from recipe' }, { status: 500 })
    }
}
