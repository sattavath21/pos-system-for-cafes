import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const db = await getDb()
        // Join with Product and Ingredient names for easier UI
        const recipes = await db.all(`
            SELECT r.*, p.name as productName, i.name as ingredientName, i.unit 
            FROM Recipe r
            JOIN Product p ON r.productId = p.id
            JOIN Ingredient i ON r.ingredientId = i.id
            ORDER BY p.name, i.name
        `)
        return NextResponse.json(recipes)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
    }
}
