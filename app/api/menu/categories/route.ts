import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
    try {
        const db = await getDb()
        const categories = await db.all('SELECT * FROM Category ORDER BY name ASC')
        return NextResponse.json(categories)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const db = await getDb()
        const { name } = await request.json()
        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

        const id = crypto.randomUUID()
        const now = new Date().toISOString()

        await db.run(
            'INSERT INTO Category (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            id, name, now, now
        )

        return NextResponse.json({ id, name }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}
