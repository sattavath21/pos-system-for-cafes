import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const recipes = await prisma.recipe.findMany({
            include: {
                product: { select: { name: true } },
                ingredient: { select: { name: true, unit: true } }
            },
            orderBy: [
                { product: { name: 'asc' } },
                { ingredient: { name: 'asc' } }
            ]
        })

        // Format to match old structure if needed, or update UI to use nested objects
        // The old structure had: productName, ingredientName, unit at the root
        const formattedRecipes = recipes.map(r => ({
            ...r,
            productName: r.product.name,
            ingredientName: r.ingredient.name,
            unit: r.ingredient.unit
        }))

        return NextResponse.json(formattedRecipes)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
    }
}
