const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
    // Categories
    const coffee = await prisma.category.create({ data: { name: "Coffee" } })
    const tea = await prisma.category.create({ data: { name: "Tea" } })
    const pastries = await prisma.category.create({ data: { name: "Pastries" } })

    // Products
    await prisma.product.create({
        data: {
            name: "Espresso",
            price: 3.5,
            categoryId: coffee.id,
            description: "Strong and bold",
            image: "/placeholder.svg?height=100&width=100",
        },
    })
    await prisma.product.create({
        data: {
            name: "Latte",
            price: 4.5,
            categoryId: coffee.id,
            description: "Milky delight",
            image: "/placeholder.svg?height=100&width=100",
        },
    })
    await prisma.product.create({
        data: {
            name: "Green Tea",
            price: 3.0,
            categoryId: tea.id,
            description: "Healthy boost",
            image: "/placeholder.svg?height=100&width=100",
        },
    })
    await prisma.product.create({
        data: {
            name: "Croissant",
            price: 3.5,
            categoryId: pastries.id,
            description: "Buttery goodness",
            image: "/placeholder.svg?height=100&width=100",
        },
    })

    // Customer
    await prisma.customer.create({
        data: {
            name: "John Doe",
            phone: "555-0123",
            email: "john@example.com",
            loyaltyPoints: 100,
        },
    })

    console.log("Seeding completed.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
