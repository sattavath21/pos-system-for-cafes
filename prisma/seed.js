const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
    console.log("Emptying database...")
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.shift.deleteMany({})
    await prisma.recipe.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.category.deleteMany({})
    await prisma.ingredient.deleteMany({})
    await prisma.customer.deleteMany({})

    console.log("Seeding categories...")
    const coffee = await prisma.category.create({ data: { name: "Coffee" } })
    const nonCoffee = await prisma.category.create({ data: { name: "Non-Coffee" } })
    const coldBrew = await prisma.category.create({ data: { name: "Cold Brew" } })
    const pastries = await prisma.category.create({ data: { name: "Pastries & Cakes" } })
    const food = await prisma.category.create({ data: { name: "Food" } })

    console.log("Seeding ingredients...")
    const coffeeBeans = await prisma.ingredient.create({ data: { name: "Coffee Beans", unit: "kg", currentStock: 10, minStock: 2, maxStock: 20, cost: 150000 } })
    const milk = await prisma.ingredient.create({ data: { name: "Fresh Milk", unit: "L", currentStock: 20, minStock: 5, maxStock: 40, cost: 25000 } })
    const sugar = await prisma.ingredient.create({ data: { name: "Sugar Syrup", unit: "L", currentStock: 5, minStock: 1, maxStock: 10, cost: 35000 } })
    const matcha = await prisma.ingredient.create({ data: { name: "Matcha Powder", unit: "kg", currentStock: 2, minStock: 0.5, maxStock: 5, cost: 450000 } })
    const flour = await prisma.ingredient.create({ data: { name: "Cake Flour", unit: "kg", currentStock: 15, minStock: 5, maxStock: 30, cost: 20000 } })
    const butter = await prisma.ingredient.create({ data: { name: "Premium Butter", unit: "kg", currentStock: 8, minStock: 2, maxStock: 15, cost: 180000 } })

    console.log("Seeding products...")
    const products = [
        // Coffee
        { name: "Espresso", price: 25000, categoryId: coffee.id, description: "Classic single shot espresso", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400" },
        { name: "Americano", price: 30000, categoryId: coffee.id, description: "Espresso with hot water", image: "https://images.unsplash.com/photo-1551030173-122adba81f3a?w=400" },
        { name: "Latte", price: 35000, categoryId: coffee.id, description: "Espresso with steamed milk", image: "https://images.unsplash.com/photo-1536939459926-301728717817?w=400" },
        { name: "Cappuccino", price: 35000, categoryId: coffee.id, description: "Rich and foamy coffee", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" },
        { name: "Dirty Coffee", price: 40000, categoryId: coffee.id, description: "Cold milk topped with hot espresso", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400" },

        // Cold Brew
        { name: "Classic Cold Brew", price: 35000, categoryId: coldBrew.id, description: "12-hour slow steeped coffee", image: "https://images.unsplash.com/photo-1517701550927-30cf4bb1dba5?w=400" },
        { name: "Orange Cold Brew", price: 45000, categoryId: coldBrew.id, description: "Refreshing cold brew with orange juice", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400" },

        // Non-Coffee
        { name: "Premium Matcha Latte", price: 45000, categoryId: nonCoffee.id, description: "Ceremonial grade Uji Matcha", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400" },
        { name: "Thai Milk Tea", price: 35000, categoryId: nonCoffee.id, description: "Classic Thai tea with condensed milk", image: "https://images.unsplash.com/photo-1558857563-b371f31ca704?w=400" },
        { name: "Cocoa Signature", price: 40000, categoryId: nonCoffee.id, description: "Rich chocolate from local beans", image: "https://images.unsplash.com/photo-1544787210-2211d7c929c7?w=400" },

        // Pastries
        { name: "Butter Croissant", price: 25000, categoryId: pastries.id, description: "French buttery flaky pastry", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400" },
        { name: "Blueberry Cheesecake", price: 45000, categoryId: pastries.id, description: "Creamy cheesecake with fresh blueberries", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400" },
        { name: "Chocolate Fudge Cake", price: 45000, categoryId: pastries.id, description: "Decadent triple chocolate cake", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" },

        // Food
        { name: "Club Sandwich", price: 55000, categoryId: food.id, description: "Double decker sandwich with chicken and bacon", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
        { name: "Spaghetti Carbonara", price: 65000, categoryId: food.id, description: "Creamy pasta with pancetta and parmesan", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400" },
        { name: "Avocado Toast", price: 50000, categoryId: food.id, description: "Sourdough bread topped with mashed avocado", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400" },
    ]

    for (const product of products) {
        await prisma.product.create({ data: product })
    }

    console.log("Seeding customers...")
    const customers = [
        { name: "Sattavath P.", phone: "020-5555-6666", email: "sattavath@example.com", loyaltyPoints: 450 },
        { name: "Keo Mani", phone: "020-1111-2222", email: "keo@example.com", loyaltyPoints: 120 },
        { name: "Somphone", phone: "020-3333-4444", email: "somphone@example.com", loyaltyPoints: 85 }
    ]

    for (const customer of customers) {
        await prisma.customer.create({ data: customer })
    }

    console.log("Seeding completed successfully!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
