import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const db = await getDb()
        const products = await db.all(`
      SELECT p.*, c.name as categoryName 
      FROM Product p 
      LEFT JOIN Category c ON p.categoryId = c.id
    `)
        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, price, category, imageUrl, isAvailable } = body

        if (!name || !price) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }

        const db = await getDb()
        const crypto = require('crypto') // Ensure crypto is available

        // Find or Create Category
        let categoryId
        if (category) {
            const cat = await db.get('SELECT id FROM Category WHERE name = ?', category)
            if (cat) {
                categoryId = cat.id
            } else {
                categoryId = crypto.randomUUID()
                await db.run('INSERT INTO Category (id, name) VALUES (?, ?)', categoryId, category)
            }
        }

        const id = crypto.randomUUID()

        await db.run(
            'INSERT INTO Product (id, name, description, price, categoryId, imageUrl, isAvailable) VALUES (?, ?, ?, ?, ?, ?, ?)',
            id, name, description, price, categoryId, imageUrl, isAvailable ? 1 : 0
        )

        return NextResponse.json({ id, name, price, categoryId }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
