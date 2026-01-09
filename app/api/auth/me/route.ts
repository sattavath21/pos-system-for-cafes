import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const session = cookieStore.get('session') || cookieStore.get('cafe_session')

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        const userData = JSON.parse(session.value)
        return NextResponse.json({
            authenticated: true,
            user: userData
        })
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 })
    }
}
