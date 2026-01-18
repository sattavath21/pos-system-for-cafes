import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const recipes = await prisma.recipe.findMany({
            where: { menuId: productId },
            include: {
                ingredient: {
                    select: {
                        name: true,
                        unit: true
                    }
                }
            }
        })

        // Format to match old structure
        const formatted = recipes.map(r => ({
            ...r,
            ingredientName: r.ingredient.name,
            unit: r.ingredient.unit
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const { ingredientId, quantity } = await request.json()

        if (!ingredientId || !quantity) {
            return NextResponse.json({ error: 'Ingredient and quantity are required' }, { status: 400 })
        }

        const recipe = await prisma.recipe.upsert({
            where: {
                menuId_ingredientId: {
                    menuId: productId,
                    ingredientId
                }
            },
            update: {
                quantity: parseFloat(quantity.toString())
            },
            create: {
                menuId: productId,
                ingredientId,
                quantity: parseFloat(quantity.toString())
            }
        })

        return NextResponse.json({ success: true, recipe })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const { searchParams } = new URL(request.url)
        const ingredientId = searchParams.get('ingredientId')

        if (!ingredientId) {
            return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 })
        }

        await prisma.recipe.delete({
            where: {
                menuId_ingredientId: {
                    menuId: productId,
                    ingredientId
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to remove ingredient from recipe' }, { status: 500 })
    }
}
