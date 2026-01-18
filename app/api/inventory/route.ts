import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const ingredients = await prisma.ingredient.findMany({
            orderBy: { name: 'asc' }
        })
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

        const ingredient = await prisma.ingredient.create({
            data: {
                name,
                unit,
                currentStock: parseFloat(currentStock) || 0,
                minStock: parseFloat(minStock) || 0,
                maxStock: parseFloat(maxStock) || 0,
                cost: parseFloat(cost) || 0
            }
        })

        return NextResponse.json(ingredient, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
    }
}
