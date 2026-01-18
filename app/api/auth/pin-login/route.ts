import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const { pin, role } = await request.json()

        if (!pin || pin.length < 4) {
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 })
        }

        if (!role) {
            return NextResponse.json({ error: 'Role is required' }, { status: 400 })
        }

        // Only get users with the specified role
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                role: role
            }
        })

        // Check PIN against users with matching role
        let matchedUser = null
        for (const user of users) {
            const isMatch = await bcrypt.compare(pin, user.pin)
            if (isMatch) {
                matchedUser = user
                break
            }
        }

        if (!matchedUser) {
            return NextResponse.json({ error: 'Invalid PIN for this role' }, { status: 401 })
        }

        // Create session
        const cookieStore = await cookies()
        const sessionData = {
            id: matchedUser.id,
            name: matchedUser.name,
            role: matchedUser.role
        }

        cookieStore.set('pos_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        })

        return NextResponse.json({
            user: {
                id: matchedUser.id,
                name: matchedUser.name,
                role: matchedUser.role
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}
