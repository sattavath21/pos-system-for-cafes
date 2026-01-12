import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
    try {
        const db = await getDb()
        const settingsRaw = await db.all('SELECT * FROM Setting')
        const settings: Record<string, string> = {}
        settingsRaw.forEach(s => {
            settings[s.key] = s.value
        })
        return NextResponse.json(settings)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const db = await getDb()
        const updates = await request.json()

        for (const [key, value] of Object.entries(updates)) {
            await db.run(
                'REPLACE INTO Setting (key, value) VALUES (?, ?)',
                [key, String(value)]
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
