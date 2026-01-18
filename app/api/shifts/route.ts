export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/shifts?status=OPEN - Get current open shift or all shifts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    try {
        const where = status ? { status: status } : {}
        const shifts = await prisma.shift.findMany({
            where,
            orderBy: { startTime: 'desc' }
        })
        return NextResponse.json(shifts)
    } catch (error) {
        console.error('Shift API GET error:', error)
        return NextResponse.json({ error: "Error fetching shifts" }, { status: 500 })
    }
}

// POST /api/shifts - Start a new shift
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Check if there is already an open shift
        const openShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' }
        })

        if (openShift) {
            return NextResponse.json({ error: "There is already an open shift" }, { status: 400 })
        }

        const shift = await prisma.shift.create({
            data: {
                userId: body.userId,
                startCash: parseFloat(body.startCash.toString()) || 0,
                responsiblePerson: body.responsiblePerson || null,
                status: 'OPEN'
            }
        })
        return NextResponse.json(shift)
    } catch (error) {
        console.error('Shift API POST error:', error)
        return NextResponse.json({ error: "Error creating shift" }, { status: 500 })
    }
}

// PUT /api/shifts - End shift
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, actualCash, responsiblePerson } = body

        if (!id) return NextResponse.json({ error: "Shift ID required" }, { status: 400 })

        const shift = await prisma.shift.findUnique({ where: { id } })
        if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 })

        const expectedCash = shift.startCash + shift.cashPayments
        const difference = (parseFloat(actualCash.toString()) || 0) - expectedCash

        const updated = await prisma.shift.update({
            where: { id },
            data: {
                endTime: new Date(),
                endCash: expectedCash,
                actualCash: parseFloat(actualCash.toString()) || 0,
                difference,
                responsiblePerson: responsiblePerson || shift.responsiblePerson,
                status: 'CLOSED'
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Shift API PUT error:', error)
        return NextResponse.json({ error: "Error closing shift" }, { status: 500 })
    }
}
