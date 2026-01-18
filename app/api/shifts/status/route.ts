export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const activeShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' },
            select: {
                id: true,
                startCash: true,
                cashPayments: true
            }
        })

        return NextResponse.json({ activeShift })
    } catch (error) {
        console.error('Shift Status API error:', error)
        return NextResponse.json({ error: "Error checking shift status" }, { status: 500 })
    }
}
