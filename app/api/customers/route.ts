import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        const db = await getDb()
        let customers

        if (query) {
            customers = await db.all(
                'SELECT * FROM Customer WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?',
                `%${query}%`, `%${query}%`, `%${query}%`
            )
        } else {
            customers = await db.all('SELECT * FROM Customer ORDER BY createdAt DESC LIMIT 50')
        }

        return NextResponse.json(customers)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, phone, email } = body

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const db = await getDb()
        const crypto = require('crypto'); // Ensure crypto is available
        const id = crypto.randomUUID()

        await db.run(
            'INSERT INTO Customer (id, name, phone, email) VALUES (?, ?, ?, ?)',
            id, name, phone, email
        )

        return NextResponse.json({ id, name, phone, email }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }
}
