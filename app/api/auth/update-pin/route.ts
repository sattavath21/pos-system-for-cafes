import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const session = cookieStore.get('pos_session')
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = JSON.parse(session.value)
        if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { role, newPin } = await request.json()
        if (!role || !newPin || newPin.length < 4) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const db = await getDb()
        const hashedPin = await bcrypt.hash(newPin, 10)

        // Update all users with that role (usually 1 admin, 1 cashier in this simple setup)
        await db.run('UPDATE User SET pin = ? WHERE role = ?', [hashedPin, role])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 })
    }
}
