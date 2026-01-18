import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        // Fetch all menus with their variations and sizes
        const menus = await prisma.menu.findMany({
            where: { isAvailable: true },
            include: {
                category: true,
                variations: {
                    where: { isEnabled: true },
                    include: {
                        sizes: {
                            where: { isAvailable: true },
                            orderBy: { displayOrder: 'asc' }
                        }
                    },
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        })

        // Transform for frontend compatibility
        const transformed = menus.map(menu => ({
            id: menu.id,
            name: menu.name,
            description: menu.description,
            image: menu.image,
            isAvailable: menu.isAvailable,
            category: menu.category?.name || "Uncategorized",
            categoryName: menu.category?.name || "Uncategorized",
            categoryId: menu.categoryId,
            variations: menu.variations.map(variation => ({
                id: variation.id,
                type: variation.type,
                isEnabled: variation.isEnabled,
                sizes: variation.sizes.map(size => ({
                    id: size.id,
                    size: size.size,
                    price: size.price,
                    isAvailable: size.isAvailable
                }))
            }))
        }))

        return NextResponse.json(transformed)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, category, image, isAvailable, variations } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Find or Create Category
        let categoryId: string
        if (category) {
            const existingCat = await prisma.category.findFirst({
                where: { name: category }
            })

            if (existingCat) {
                categoryId = existingCat.id
            } else {
                const newCat = await prisma.category.create({
                    data: { name: category }
                })
                categoryId = newCat.id
            }
        } else {
            const firstCat = await prisma.category.findFirst()
            if (!firstCat) throw new Error("No categories found. Create a category first.")
            categoryId = firstCat.id
        }

        // Create menu with variations and sizes
        const menu = await prisma.menu.create({
            data: {
                name,
                description,
                categoryId,
                image: image || '/placeholder.svg',
                isAvailable: isAvailable ?? true,
                variations: {
                    create: variations?.map((v: any) => ({
                        type: v.type,
                        isEnabled: v.isEnabled ?? true,
                        displayOrder: parseInt(v.displayOrder?.toString() || "0"),
                        sizes: {
                            create: v.sizes?.map((s: any) => ({
                                size: s.size,
                                price: parseFloat(s.price.toString()),
                                isAvailable: s.isAvailable ?? true,
                                displayOrder: parseInt(s.displayOrder?.toString() || "0")
                            })) || []
                        }
                    })) || []
                }
            },
            include: {
                variations: {
                    include: {
                        sizes: true
                    }
                }
            }
        })

        return NextResponse.json(menu, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
    }
}
