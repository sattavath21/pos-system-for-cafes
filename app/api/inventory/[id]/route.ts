import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, unit, mainStock, subStock, minStock, maxStock, cost } = body

        const ingredient = await prisma.ingredient.update({
            where: { id },
            data: {
                name,
                unit,
                mainStock: parseFloat(mainStock.toString()),
                subStock: parseFloat(subStock.toString()),
                minStock: parseFloat(minStock.toString()),
                maxStock: parseFloat(maxStock.toString()),
                cost: parseFloat(cost.toString())
            }
        })

        return NextResponse.json({ success: true, ingredient })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        await prisma.ingredient.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 })
    }
}
