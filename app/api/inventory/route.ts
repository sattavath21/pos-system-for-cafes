import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const db = await getDb()
        const ingredients = await db.all('SELECT * FROM Ingredient ORDER BY name')
        return NextResponse.json(ingredients)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, unit, currentStock, minStock, maxStock, cost } = body

        if (!name || !unit) {
            return NextResponse.json({ error: 'Name and unit are required' }, { status: 400 })
        }

        const db = await getDb()
        const crypto = require('crypto')
        const id = crypto.randomUUID()

        await db.run(
            'INSERT INTO Ingredient (id, name, unit, currentStock, minStock, maxStock, cost, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            id, name, unit, currentStock || 0, minStock || 0, maxStock || 0, cost || 0
        )

        return NextResponse.json({ id, name, unit }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
    }
}
