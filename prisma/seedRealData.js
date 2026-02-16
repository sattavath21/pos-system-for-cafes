const { PrismaClient } = require("@prisma/client")
const { subDays, startOfDay, addMinutes, addHours } = require("date-fns")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

async function main() {
    console.log("Emptying database...")
    // Order matters for foreign keys
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.shift.deleteMany({})
    await prisma.variationSize.deleteMany({})
    await prisma.menuVariation.deleteMany({})
    await prisma.recipe.deleteMany({})
    await prisma.menu.deleteMany({})
    await prisma.category.deleteMany({})
    await prisma.stockTransaction.deleteMany({})
    await prisma.ingredient.deleteMany({})
    await prisma.customer.deleteMany({})
    await prisma.promotion.deleteMany({})
    await prisma.user.deleteMany({})

    // ========== SEED USERS ==========
    console.log("Seeding users...")
    const adminPin = await bcrypt.hash("1234", 10)
    const cashierPin = await bcrypt.hash("5678", 10)
    const staffPin = await bcrypt.hash("0000", 10)

    await prisma.user.createMany({
        data: [
            { name: "Admin", role: "ADMIN", pin: adminPin },
            { name: "Cashier", role: "CASHIER", pin: cashierPin },
            { name: "Staff", role: "STAFF", pin: staffPin }
        ]
    })

    // ========== CATEGORIES ==========
    console.log("Seeding categories...")
    const categories = {
        Coffee: await prisma.category.create({ data: { name: "Coffee" } }),
        NonCoffee: await prisma.category.create({ data: { name: "Non-coffee" } }),
        Matcha: await prisma.category.create({ data: { name: "Matcha" } }),
        Fruity: await prisma.category.create({ data: { name: "Fruity" } }),
        Smoothie: await prisma.category.create({ data: { name: "Smoothie" } }),
        Premium: await prisma.category.create({ data: { name: "Premium" } }),
        Cake: await prisma.category.create({ data: { name: "Cake" } }),
        // New Food Categories
        Choux: await prisma.category.create({ data: { name: "Choux" } }),
        Sourdough: await prisma.category.create({ data: { name: "Sourdough" } }),
        Sandwich: await prisma.category.create({ data: { name: "Sandwich" } }),
        Bao: await prisma.category.create({ data: { name: "Bao" } }),
        Pie: await prisma.category.create({ data: { name: "Pie" } }),
        Dumpling: await prisma.category.create({ data: { name: "Dumpling" } }),
    }

    // ========== INVENTORY (INGREDIENTS) ==========
    console.log("Seeding inventory items...")

    // 1. Raw Materials (Items 1-7)
    // Using Lao Name as Primary Name for Inventory
    const rawMaterials = [
        { name: "Hot Cup (Go Home) 802", nameLaos: "ຈອກກາແຟຮ້ອນກັບບ້ານ (802)", unit: "cup", stock: 625 },     // 1
        { name: "Hot Cup (Go Home) 6502", nameLaos: "ຈອກກາແຟຮ້ອນ ກັບບ້ານ (6,502)", unit: "cup", stock: 200 },    // 2
        { name: "Hot Cup Lid 802 (Blue)", nameLaos: "ຝາຈອກກາແຟຮ້ອນ (802 ເຈ້ຍຟ້າ)", unit: "lid", stock: 250 },    // 3
        { name: "Hot Cup Lid 802 (Orange)", nameLaos: "ຝາຈອກກາແຟຮ້ອນ (802 ເຈ້ຍສົ້ມ)", unit: "lid", stock: 100 },  // 4
        { name: "Straw 6mm (MyItems Brown)", nameLaos: "ຫຼອດດູດ 6 mm (ສີນ້ຳຕານກາ MyItems)", unit: "pcs", stock: 300 }, // 5
        { name: "Straw 6mm (Bio Green)", nameLaos: "ຫຼອດດູດ 6 mm (ກາ Bio ເຈ້ຍຂຽວ)", unit: "pcs", stock: 960 },     // 6
        { name: "Straw 6mm (Aro)", nameLaos: "ຫຼອດດູດ 6 mm (ກາ Aro)", unit: "pcs", stock: 1000 },          // 7
    ]

    for (const item of rawMaterials) {
        await prisma.ingredient.create({
            data: {
                name: item.nameLaos, // Primary Lao Name
                unit: item.unit,
                mainStock: item.stock,
                subStock: 0,
                minStock: 50,
                maxStock: 2000,
                cost: 0
            }
        })
    }

    // 2. Finished Goods (Items 8-22 + Cakes) -> Inventory + Menu 1:1
    const foodItems = [
        // Choux
        { name: "Milk Choux Cream", nameLaos: "ຊູຄີມນົມ", category: "Choux", image: "choux-cream" }, // 8
        { name: "Chocolate Choux Cream", nameLaos: "ຊູຄີມຊັອກ", category: "Choux", image: "chocolate-choux" }, // 9
        // Sourdough
        { name: "Sourdough Quinoa + Sesame", nameLaos: "ຊາວໂດຄີນົວ + ງາຂາວ + ງາດຳ", category: "Sourdough", image: "sourdough-bread" }, // 10
        { name: "Sourdough Cranberry + Walnut", nameLaos: "ຊາວໂດ ແຄນເບີຮີ້ + ວໍນັດ", category: "Sourdough", image: "sourdough-walnut" }, // 11
        { name: "Sourdough Whole Wheat", nameLaos: "ຊາວໂດ ໂຮລວີທ", category: "Sourdough", image: "whole-wheat-bread" }, // 12
        // Sandwich
        { name: "Traditional Sandwich", nameLaos: "ແຊນວິດສູດບູຮານ", category: "Sandwich", image: "club-sandwich" }, // 13
        { name: "Egg White Sandwich", nameLaos: "ເຂົ້າຈີ່ໄຂ່ຂາວ", category: "Sandwich", image: "egg-sandwich" }, // 17
        // Bao
        { name: "Minced Pork Steamed Bun", nameLaos: "ຊາລາເປົາ ໝູສັບ", category: "Bao", image: "steamed-bun-pork" }, // 14
        { name: "Cream Steamed Bun", nameLaos: "ຊາລາເປົາ ຄຣີມ", category: "Bao", image: "steamed-bun-cream" }, // 15
        { name: "Steamed Bun", nameLaos: "ຊາລາເປົາ", category: "Bao", image: "steamed-bun" }, // 16
        // Pie
        { name: "Pineapple Pie", nameLaos: "ພາຍຝະລັ່ງໃຈໝາກນັດ", category: "Pie", image: "pineapple-pie" }, // 18
        { name: "Mushroom & Black Pepper Pie", nameLaos: "ພາຍຝະລັ່ງໃຈເຫັດຫອມພິກໄທດຳ", category: "Pie", image: "mushroom-pie" }, // 19
        { name: "Chicken Curry Pie", nameLaos: "ພາຍຝະລັ່ງກະຫຼີ່ໄກ່", category: "Pie", image: "curry-puff" }, // 20
        // Dumpling
        { name: "Chicken Curry Puff", nameLaos: "ປັ້ນສິບໃຈໄກ່", category: "Dumpling", image: "curry-puff-chicken" }, // 21
        { name: "Pineapple Curry Puff", nameLaos: "ປັ້ນສິບໃຈໝາກນັດ", category: "Dumpling", image: "pineapple-puff" }, // 22
    ]

    const cakeItems = [
        { name: "Matcha Banoffee", nameLaos: "ເຄັກມັດຊະ ບານັອບຟີ່", category: "Cake", image: "matcha-cake" },
        { name: "Matcha Orio", nameLaos: "ເຄັກມັດຊະ ໂອຣີໂອ້", category: "Cake", image: "oreo-cake" },
        { name: "Chocolate Cake", nameLaos: "ເຄັກຊັອກໂກແລັດ", category: "Cake", image: "chocolate-cake" },
        { name: "Banana Caramel", nameLaos: "ເຄັກກ້ວຍ ຄາຣາເມວ", category: "Cake", image: "banana-cake" },
        { name: "Orange Cake", nameLaos: "ເຄັກໝາກກ້ຽງ ແມນດາຣິນ", category: "Cake", image: "orange-cake" },
        { name: "Red Velvet cake", nameLaos: "ເຄັກພົມແດງ", category: "Cake", image: "red-velvet-cake" },
        { name: "Lemon Cheese Cake", nameLaos: "ເລມ້ອນຊີສເຄັກ", category: "Cake", image: "lemon-cheesecake" },
        { name: "Fresh Chocolate Cake – Milk", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ຣົດນົມ", category: "Cake", image: "chocolate-milk-cake" },
        { name: "Fresh Chocolate Cake – Grape", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ປະສົມໝາກເລີແຊງ", category: "Cake", image: "grape-cake" },
        { name: "Fresh Chocolate Cake – Dark 70%", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ເຂັ້ມ 70%", category: "Cake", image: "dark-chocolate-cake" },
        { name: "Fresh Chocolate Cake – Dark 100%", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ເຂັ້ມ 100%", category: "Cake", image: "dark-chocolate-cake" },
        { name: "Fresh Chocolate Cake – Macadamia", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ປະສົມແມັກຄາດີເມຍ", category: "Cake", image: "macadamia-cake" },
    ]

    const allInventoryMenuLinks = [...foodItems, ...cakeItems]

    // Create these as Inventory Items (Ingredients) first 
    for (const item of allInventoryMenuLinks) {
        const ingredient = await prisma.ingredient.create({
            data: {
                name: item.nameLaos, // Primary Lao Name
                unit: "pcs",
                mainStock: 100,
                subStock: 50,
                minStock: 10,
                maxStock: 200,
                cost: 15000
            }
        })
        item.ingredientId = ingredient.id
    }

    // ========== MENUS ==========
    console.log("Seeding menu items...")

    // Helper to create menu
    async function seedMenu(name, nameLaos, categoryKey, variants, imageKeyword, hasZeroCal = false, priceStart = 25000) {

        const imageUrl = `https://source.unsplash.com/400x400/?${imageKeyword || name}`.replace(/\s+/g, '-')

        const menu = await prisma.menu.create({
            data: {
                name: name,         // English Name
                localName: nameLaos,// Lao Name
                categoryId: categories[categoryKey].id,
                image: imageUrl
            }
        })

        if (!variants || variants.length === 0) {
            variants = [{ type: "Standard", sizes: [{ size: "Standard" }] }]
        }

        let displayOrder = 1
        for (const vType of variants) {
            const typeName = typeof vType === 'string' ? vType : vType.type

            const variation = await prisma.menuVariation.create({
                data: {
                    menuId: menu.id,
                    type: typeName,
                    isEnabled: true,
                    displayOrder: displayOrder++
                }
            })

            let basePrice = priceStart
            if (typeName === 'Iced') basePrice += 5000
            if (typeName === 'Blended') basePrice += 10000

            await prisma.variationSize.create({
                data: {
                    variationId: variation.id,
                    size: "Standard",
                    price: basePrice,
                    displayOrder: 1
                }
            })

            if (hasZeroCal) {
                await prisma.variationSize.create({
                    data: {
                        variationId: variation.id,
                        size: "Zero Cal Sweetener",
                        price: basePrice * 1.5,
                        displayOrder: 2
                    }
                })
            }
        }
        return menu
    }

    // 1. Coffee
    const coffeeList = [
        { name: "Americano", local: "ອາເມຣິກາໂນ່", vars: ["Hot", "Iced"], zero: false, img: "americano-coffee" },
        { name: "Espresso", local: "ເອສເພຣສໂຊ່", vars: ["Iced"], zero: true, img: "espresso-coffee" },
        { name: "Cappuccino", local: "ຄາປູຊີໂນ່", vars: ["Hot", "Iced", "Blended"], zero: true, img: "cappuccino" },
        { name: "Latte", local: "ລາເຕ້", vars: ["Hot", "Iced"], zero: true, img: "latte-art" },
        { name: "Mocha", local: "ມັອກຄ່າ", vars: ["Hot", "Iced"], zero: true, img: "mocha-coffee" },
        { name: "Honey Americano", local: "ອາເມຣິກາໂນ່ ນ້ຳເຜິ້ງ", vars: ["Iced"], zero: false, img: "honey-coffee" },
        { name: "Coconut Americano", local: "ອາເມຣິກາໂນ່ ໝາກພ້າວ", vars: ["Iced"], zero: false, img: "coconut-coffee" },
        { name: "Orange Americano", local: "ອາເມຣິກາໂນ່ ໝາກກ້ຽງ", vars: ["Iced"], zero: false, img: "orange-coffee" },
        { name: "Yuzu Americano", local: "ອາເມຣິກາໂນ່ ໝາກກ້ຽງຢີ່ປຸ່ນ", vars: ["Iced"], zero: false, img: "yuzu-coffee" },
    ]

    for (const m of coffeeList) {
        await seedMenu(m.name, m.local, "Coffee", m.vars, m.img, m.zero, 25000)
    }

    // 2. Non-Coffee
    const nonCoffeeList = [
        { name: "Cacao", local: "ໂກໂກ້", vars: ["Hot", "Iced", "Blended"], zero: true, img: "cocoa-drink" },
        { name: "Green Tea", local: "ຊາຂຽວ", vars: ["Iced", "Blended"], zero: true, img: "green-tea-latte" },
        { name: "Thai Tea", local: "ຊາໄທ", vars: ["Iced"], zero: true, img: "thai-tea" },
        { name: "Red Tea Latte", local: "ຊາແດງລາເຕ້", vars: ["Iced"], zero: true, img: "red-tea-latte" },
    ]
    for (const m of nonCoffeeList) {
        await seedMenu(m.name, m.local, "NonCoffee", m.vars, m.img, m.zero, 30000)
    }

    // 3. Matcha
    const matchaList = [
        { name: "Pure Matcha", local: "ພຽງມັດຊະ", vars: ["Iced"], zero: false, img: "matcha-tea" },
        { name: "Matcha Latte", local: "ມັດຊະ ລາເຕ້", vars: ["Iced"], zero: true, img: "matcha-latte" },
        { name: "Coconut Matcha", local: "ມັດຊະ ນ້ຳໝາກພ້າວ", vars: ["Iced"], zero: false, img: "coconut-matcha" },
        { name: "Orange Matcha", local: "ມັດຊະ ນ້ຳໝາກກ້ຽງ", vars: ["Iced"], zero: false, img: "orange-matcha" },
        { name: "Strawberry Matcha Latte", local: "ມັດຊະ ສະຕໍເບີຣີ້ນົມສົດ", vars: ["Iced"], zero: false, img: "strawberry-matcha" },
    ]
    for (const m of matchaList) {
        await seedMenu(m.name, m.local, "Matcha", m.vars, m.img, m.zero, 35000)
    }

    // 4. Fruity
    const fruityList = [
        { name: "Yuzu Honey Lemon", local: "ຢູຊຸຮັນນີ້ ເລມ່ອນ", vars: ["Iced"], img: "yuzu-honey" },
        { name: "Yuzu Soda", local: "ຢູຊຸໂຊດາ", vars: ["Iced"], img: "yuzu-soda" },
        { name: "Apple Soda", local: "ແອັບເປິ້ນ ໂຊດາ", vars: ["Iced"], img: "apple-soda" },
        { name: "Lemon Peach Soda", local: "ເລມ່ອນ ພີດ ໂຊດາ", vars: ["Iced"], img: "peach-soda" },
    ]
    for (const m of fruityList) {
        await seedMenu(m.name, m.local, "Fruity", m.vars, m.img, false, 35000)
    }

    // 5. Smoothie
    const smoothieList = [
        { name: "Blue Sky Smoothie", local: "ບລູສະກາຍ ສະມູດຕີ້", vars: ["Blended"], img: "blue-smoothie" },
        { name: "Hokkaido Orio Smoothie", local: "ຮັອກໄກໂດ ໂອຣິໂອ້ ສະມູດຕີ້", vars: ["Blended"], img: "oreo-shake" },
        { name: "Mixed Berry Smoothie", local: "ເບີຣີ້ລວມ ສະມູດຕິ້", vars: ["Blended"], img: "berry-smoothie" },
        { name: "Açaí Berry Smoothie", local: "ອາຊາອິເບີຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "acai-bowl" },
        { name: "Blueberry Smoothie", local: "ບລູເບີຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "blueberry-smoothie" },
        { name: "Strawberry Smoothie", local: "ສະຕໍເບີຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "strawberry-smoothie" },
        { name: "Cranberry Smoothie", local: "ແຄນເບຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "cranberry-smoothie" },
        { name: "Avocado + Banana Smoothie", local: "ອາໂວຄາໂດ້ + ກ້ວຍ ສະມູດຕີ້", vars: ["Blended"], img: "avocado-smoothie" },
        { name: "Apple + Kale Smoothie", local: "ແອັບເປິ້ນ + ເຄວ ສະມູດຕີ້", vars: ["Blended"], img: "green-smoothie" },
        { name: "Apple + Green Mixed Smoothie", local: "ແອັບເປິ້ນ + ຜັກລວມ ສະມູດຕີ້", vars: ["Blended"], img: "green-juice" },
    ]
    for (const m of smoothieList) {
        await seedMenu(m.name, m.local, "Smoothie", m.vars, m.img, false, 40000)
    }

    // 6. Premium
    const premiumList = [
        { name: "Premium Americano", local: "ພຣີມ້ຽມ ອາເມຣິກາໂນ່", vars: ["Hot", "Iced"], zero: false, img: "premium-coffee" },
        { name: "Premium Espresso", local: "ພຣີມ້ຽມ ເອສເພຣສໂຊ່", vars: ["Iced"], zero: true, img: "premium-espresso" },
        { name: "Premium Cappuccino", local: "ພຣີມ້ຽມ ຄາປູຊີໂນ່", vars: ["Hot", "Iced"], zero: true, img: "premium-cappuccino" },
        { name: "Premium Latte", local: "ພຣີມ້ຽມ ລາເຕ້", vars: ["Hot", "Iced"], zero: true, img: "premium-latte" },
        { name: "Premium Pure Matcha", local: "ພຣີມ້ຽມ ພຽງມັດຊະ", vars: ["Iced"], zero: false, img: "ceremonial-matcha" },
        { name: "Premium Matcha Latte", local: "ພຣີມ້ຽມ ມັດຊະ ລາເຕ້", vars: ["Iced"], zero: true, img: "matcha-latte-art" },
        { name: "Premium Matcha Latte Almond Milk", local: "ພຣີມ້ຽມ ມັດຊະ ລາເຕ້ ນົມອາວມ້ອນ", vars: ["Iced"], zero: true, img: "almond-matcha" },
        { name: "Premium Matcha Latte Oat Milk", local: "ພຣີມ້ຽມ ມັດຊະ ລາເຕ້ ນົມໂອ້ດ", vars: ["Iced"], zero: true, img: "oat-matcha" },
        { name: "Premium Espresso Almond Milk", local: "ພຣີມ້ຽມ ເອສເພຣສໂຊ່ ນົມອາວມ້ອນ", vars: ["Iced"], zero: true, img: "almond-coffee" },
        { name: "Premium Latte Almond Milk", local: "ພຣີມ້ຽມ ລາເຕ້ ນົມອາວມ້ອນ", vars: ["Iced"], zero: true, img: "almond-latte" },
    ]
    for (const m of premiumList) {
        await seedMenu(m.name, m.local, "Premium", m.vars, m.img, m.zero, 45000)
    }

    // 7. Inventory Linked Menus (Cakes, Pastries, etc.)
    for (const item of allInventoryMenuLinks) {
        // Create Menu
        const menu = await seedMenu(item.name, item.nameLaos, item.category, ["Standard"], item.image, false, 35000)

        // Create Recipe (1:1 link to ingredient)
        if (item.ingredientId) {
            await prisma.recipe.create({
                data: {
                    menuId: menu.id,
                    ingredientId: item.ingredientId, // Link to the ingredient we created earlier
                    quantity: 1 // Deduct 1 unit
                }
            })
        }
    }

    // ========== MOCK TRANSACTION DATA ==========
    console.log("Seeding mock transaction data...")

    const allSizes = await prisma.variationSize.findMany({
        include: {
            variation: {
                include: { menu: true }
            }
        }
    })

    const allIngredients = await prisma.ingredient.findMany()

    const now = new Date()
    const ordersData = []

    // Create ~500 orders across last 30 days
    for (let i = 0; i < 500; i++) {
        // Random date in last 30 days
        const orderDate = subDays(now, getRandomInt(0, 30))
        const hour = getRandomInt(8, 20)
        const minute = getRandomInt(0, 59)
        const finalDate = addMinutes(addHours(startOfDay(orderDate), hour), minute)

        const itemCount = getRandomInt(1, 4)
        let subtotal = 0
        const itemsToCreate = []

        for (let j = 0; j < itemCount; j++) {
            const size = getRandomItem(allSizes)
            const qty = getRandomInt(1, 2)
            const itemTotal = size.price * qty
            subtotal += itemTotal

            itemsToCreate.push({
                variationSizeId: size.id,
                name: `${size.variation.menu.localName} (${size.variation.menu.name}) - ${size.variation.type}`, // Snapshot Name
                price: size.price,
                quantity: qty,
                total: itemTotal,
                sugarLevel: getRandomItem(["Normal", "Less Sweet", "No Sweet", "Extra Sweet"]),
            })
        }

        const tax = Math.round(subtotal * 0.1)
        const total = subtotal + tax

        ordersData.push({
            finalDate,
            subtotal,
            tax,
            total,
            itemsToCreate
        })
    }

    ordersData.sort((a, b) => a.finalDate - b.finalDate)
    const dailyCounters = {}

    for (const order of ordersData) {
        const dayKey = order.finalDate.toISOString().split('T')[0]
        if (!dailyCounters[dayKey]) dailyCounters[dayKey] = 0
        dailyCounters[dayKey]++

        const orderNum = `No. ${dailyCounters[dayKey]}`

        await prisma.order.create({
            data: {
                orderNumber: orderNum,
                status: 'COMPLETED',
                subtotal: order.subtotal,
                tax: order.tax,
                total: order.total,
                taxAmount: order.tax,
                createdAt: order.finalDate,
                updatedAt: order.finalDate,
                isReportable: true,
                paymentMethod: getRandomItem(['CASH', 'TRANSFER']),
                items: {
                    create: order.itemsToCreate
                }
            }
        })
    }

    // Mock Stock Transactions
    console.log("Seeding mock stock transactions...")
    for (const ingredient of allIngredients) {
        // Initial Deposit
        await prisma.stockTransaction.create({
            data: {
                ingredientId: ingredient.id,
                type: 'DEPOSIT',
                quantity: ingredient.mainStock,
                cost: ingredient.cost || 0,
                notes: 'Initial Stock',
                createdAt: subDays(now, 30) // 30 days ago
            }
        })

        // Random Usage
        for (let i = 0; i < 5; i++) {
            const quantity = getRandomInt(1, 10)
            await prisma.stockTransaction.create({
                data: {
                    ingredientId: ingredient.id,
                    type: 'USAGE',
                    quantity: quantity,
                    notes: 'Daily Usage',
                    createdAt: subDays(now, getRandomInt(1, 29))
                }
            })
        }
    }

    console.log("Seeding completed successfully!")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
