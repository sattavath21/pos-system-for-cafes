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
    const now = new Date()
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
        Puff: await prisma.category.create({ data: { name: "Puff" } }),
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
                minStockSub: 20,
                maxStockSub: 500,
                cost: 0
            }
        })
    }

    // 2. Finished Goods (Items 8-22 + Cakes) -> Inventory + Menu 1:1
    const foodItems = [
        // Choux
        { name: "Milk Choux Cream", nameLaos: "ຊູຄີມນົມ", category: "Choux", image: "/uploads/milk-choux-cream.jpg" }, // 8
        { name: "Chocolate Choux Cream", nameLaos: "ຊູຄີມຊັອກ", category: "Choux", image: "/uploads/Chocolate-Choux-cream.jpg" }, // 9
        // Sourdough
        { name: "Sourdough Quinoa + Sesame", nameLaos: "ຊາວໂດຄີນົວ + ງາຂາວ + ງາດຳ", category: "Sourdough", image: "/uploads/sourdough-quinoa-sesame.jpg" }, // 10
        { name: "Sourdough Cranberry + Walnut", nameLaos: "ຊາວໂດ ແຄນເບີຮີ້ + ວໍນັດ", category: "Sourdough", image: "/uploads/sourdough-cranberry-walnut.jpg" }, // 11
        { name: "Sourdough Whole Wheat", nameLaos: "ຊາວໂດ ໂຮລວີທ", category: "Sourdough", image: "/uploads/sourdough-whole-wheat.jpg" }, // 12
        // Sandwich
        { name: "Traditional Sandwich", nameLaos: "ແຊນວິດສູດບູຮານ", category: "Sandwich", image: "/uploads/traditional-sandwich.jpg" }, // 13
        { name: "Egg White Sandwich", nameLaos: "ເຂົ້າຈີ່ໄຂ່ຂາວ", category: "Sandwich", image: "/uploads/Egg-White-Sandwich.jpg" }, // 17
        // Bao
        { name: "Minced Pork Steamed Bun", nameLaos: "ຊາລາເປົາ ໝູສັບ", category: "Bao", image: "/uploads/micned-pork-steamed-bun.jpg" }, // 14
        { name: "Cream Steamed Bun", nameLaos: "ຊາລາເປົາ ຄຣີມ", category: "Bao", image: "/uploads/cream-steamed-bun.jpg" }, // 15
        { name: "Steamed Bun", nameLaos: "ຊາລາເປົາ", category: "Bao", image: "/uploads/steamed-bun.jpg" }, // 16
        // Pie
        { name: "Pineapple Pie", nameLaos: "ພາຍຝະລັ່ງໃຈໝາກນັດ", category: "Pie", image: "/uploads/pineapple-pie.jpg" }, // 18
        { name: "Mushroom & Black Pepper Pie", nameLaos: "ພາຍຝະລັ່ງໃຈເຫັດຫອມພິກໄທດຳ", category: "Pie", image: "/uploads/mushroom-black-pepper-pie.jpeg" }, // 19
        { name: "Chicken Curry Pie", nameLaos: "ພາຍຝະລັ່ງກະຫຼີ່ໄກ່", category: "Pie", image: "/uploads/chicken-currey-pie.jpg" }, // 20
        // Dumpling
        { name: "Chicken Puff", nameLaos: "ປັ້ນສິບໃຈໄກ່", category: "Puff", image: "/uploads/chicken-curry-puff.jpg" }, // 21
        { name: "Pineapple Puff", nameLaos: "ປັ້ນສິບໃຈໝາກນັດ", category: "Puff", image: "/uploads/pineapple-curry-puff.jpg" }, // 22
        { name: "Mung Bean Puff", nameLaos: "ປັ້ນສິບໃຈຖົ່ວເຫຼືອງ", category: "Puff", image: "mung-bean-puff.png" }, // 23

    ]

    const cakeItems = [
        { name: "Matcha Banoffee", nameLaos: "ເຄັກມັດຊະ ບານັອບຟີ່", category: "Cake", image: "/uploads/marcha-banoffee.png" },
        { name: "Matcha Oreo", nameLaos: "ເຄັກມັດຊະ ໂອຣີໂອ້", category: "Cake", image: "/uploads/marcha-oreo-cake.jpg" },
        { name: "Chocolate Cake", nameLaos: "ເຄັກຊັອກໂກແລັດ", category: "Cake", image: "/uploads/chocolate-cake.jpg" },
        { name: "Banana Caramel", nameLaos: "ເຄັກກ້ວຍ ຄາຣາເມວ", category: "Cake", image: "/uploads/banana-caramel-cake.jpeg" },
        { name: "Orange Cake", nameLaos: "ເຄັກໝາກກ້ຽງ ແມນດາຣິນ", category: "Cake", image: "/uploads/orange-cake.jpg" },
        { name: "Red Velvet cake", nameLaos: "ເຄັກພົມແດງ", category: "Cake", image: "/uploads/Red-Velvet-Cake.jpg" },
        { name: "Lemon Cheese Cake", nameLaos: "ເລມ້ອນຊີສເຄັກ", category: "Cake", image: "lemon-cheesecake.jpg" },
        { name: "Fresh Chocolate Cake – Milk", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ຣົດນົມ", category: "Cake", image: "/uploads/milk-choco-cake.jpg" },
        { name: "Fresh Chocolate Cake – Grape", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ປະສົມໝາກເລີແຊງ", category: "Cake", image: "/uploads/choco-cake-grape.jpg" },
        { name: "Fresh Chocolate Cake – Dark 70%", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ເຂັ້ມ 70%", category: "Cake", image: "/uploads/choco-cake-dark.jpg" },
        { name: "Fresh Chocolate Cake – Dark 100%", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ເຂັ້ມ 100%", category: "Cake", image: "/uploads/choco-cake-dark.jpg" },
        { name: "Fresh Chocolate Cake – Macadamia", nameLaos: "ເຄັກຊັອກໂກແລັດສົດ ປະສົມແມັກຄາດີເມຍ", category: "Cake", image: "/uploads/Chocolate-Macadamia-Cake.jpg" },
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
                minStockSub: 5,
                maxStockSub: 50,
                cost: 15000
            }
        })
        item.ingredientId = ingredient.id
    }

    // ========== MENUS ==========
    console.log("Seeding menu items...")

    // Helper to create menu
    async function seedMenu(name, nameLaos, categoryKey, variants, imageKeyword, hasZeroCal = false, priceStart = 25000) {

        let imageUrl = imageKeyword
        if (!imageUrl || !imageUrl.startsWith('/')) {
            imageUrl = `https://source.unsplash.com/400x400/?${imageKeyword || name}`.replace(/\s+/g, '-')
        }

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
        { name: "Americano", local: "ອາເມຣິກາໂນ່", vars: ["Hot", "Iced"], zero: false, img: "/uploads/Americano.jpeg" },
        { name: "Espresso", local: "ເອສເພຣສໂຊ່", vars: ["Iced"], zero: true, img: "/uploads/espresso.jpg" },
        { name: "Cappuccino", local: "ຄາປູຊີໂນ່", vars: ["Hot", "Iced", "Blended"], zero: true, img: "/uploads/cappuccino.jpg" },
        { name: "Latte", local: "ລາເຕ້", vars: ["Hot", "Iced"], zero: true, img: "/uploads/latte.jpg" },
        { name: "Mocha", local: "ມັອກຄ່າ", vars: ["Hot", "Iced"], zero: true, img: "/uploads/mocha.jpg" },
        { name: "Honey Americano", local: "ອາເມຣິກາໂນ່ ນ້ຳເຜິ້ງ", vars: ["Iced"], zero: false, img: "/uploads/honey-americano.jpg" },
        { name: "Coconut Americano", local: "ອາເມຣິກາໂນ່ ໝາກພ້າວ", vars: ["Iced"], zero: false, img: "/uploads/coconut-americano.jpg" },
        { name: "Orange Americano", local: "ອາເມຣິກາໂນ່ ໝາກກ້ຽງ", vars: ["Iced"], zero: false, img: "/uploads/orange-americano.png" },
        { name: "Yuzu Americano", local: "ອາເມຣິກາໂນ່ ໝາກກ້ຽງຢີ່ປຸ່ນ", vars: ["Iced"], zero: false, img: "/uploads/yuzu-americano.png" },
    ]

    for (const m of coffeeList) {
        await seedMenu(m.name, m.local, "Coffee", m.vars, m.img, m.zero, 25000)
    }

    // 2. Non-Coffee
    const nonCoffeeList = [
        { name: "Cacao", local: "ໂກໂກ້", vars: ["Hot", "Iced", "Blended"], zero: true, img: "/uploads/cacao.jpg" },
        { name: "Green Tea", local: "ຊາຂຽວ", vars: ["Iced", "Blended"], zero: true, img: "/uploads/green-tea.jpg" },
        { name: "Thai Tea", local: "ຊາໄທ", vars: ["Iced"], zero: true, img: "/uploads/thai-tea.jpg" },
        { name: "Red Tea Latte", local: "ຊາແດງລາເຕ້", vars: ["Iced"], zero: true, img: "/uploads/Rose-Latte.jpg" },
    ]
    for (const m of nonCoffeeList) {
        await seedMenu(m.name, m.local, "NonCoffee", m.vars, m.img, m.zero, 30000)
    }

    // 3. Matcha
    const matchaList = [
        { name: "Pure Matcha", local: "ພຽງມັດຊະ", vars: ["Iced"], zero: false, img: "/uploads/pure-matcha.png" },
        { name: "Matcha Latte", local: "ມັດຊະ ລາເຕ້", vars: ["Iced"], zero: true, img: "/uploads/matcha-latte.jpg" },
        { name: "Coconut Matcha", local: "ມັດຊະ ນ້ຳໝາກພ້າວ", vars: ["Iced"], zero: false, img: "/uploads/coconut-matcha.jpg" },
        { name: "Orange Matcha", local: "ມັດຊະ ນ້ຳໝາກກ້ຽງ", vars: ["Iced"], zero: false, img: "/uploads/orange-matcha.jpg" },
        { name: "Strawberry Matcha Latte", local: "ມັດຊະ ສະຕໍເບີຣີ້ນົມສົດ", vars: ["Iced"], zero: false, img: "/uploads/Strawberry-Matcha-LatteI.jpg" },
    ]
    for (const m of matchaList) {
        await seedMenu(m.name, m.local, "Matcha", m.vars, m.img, m.zero, 35000)
    }

    // 4. Fruity
    const fruityList = [
        { name: "Yuzu Honey Lemon", local: "ຢູຊຸຮັນນີ້ ເລມ່ອນ", vars: ["Iced"], img: "/uploads/yuzu-honey-lemon.jpg" },
        { name: "Yuzu Soda", local: "ຢູຊຸໂຊດາ", vars: ["Iced"], img: "/uploads/Yuzu-Soda.jpeg" },
        { name: "Apple Soda", local: "ແອັບເປິ້ນ ໂຊດາ", vars: ["Iced"], img: "/uploads/apple-soda.jpg" },
        { name: "Lemon Peach Soda", local: "ເລມ່ອນ ພີດ ໂຊດາ", vars: ["Iced"], img: "/uploads/peach-lemon-soda.jpeg" },
    ]
    for (const m of fruityList) {
        await seedMenu(m.name, m.local, "Fruity", m.vars, m.img, false, 35000)
    }

    // 5. Smoothie
    const smoothieList = [
        { name: "Blue Sky Smoothie", local: "ບລູສະກາຍ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/blue-sky-smoothie.jpg" },
        { name: "Hokkaido Oreo Smoothie", local: "ຮັອກໄກໂດ ໂອຣິໂອ້ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/Oreo-smoothie.jpg" },
        { name: "Mixed Berry Smoothie", local: "ເບີຣີ້ລວມ ສະມູດຕິ້", vars: ["Blended"], img: "/uploads/mixed-berry-smoothie.jpg" },
        { name: "Açaí Berry Smoothie", local: "ອາຊາອິເບີຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/Acai-berry-Smoothie.jpg" },
        { name: "Blueberry Smoothie", local: "ບລູເບີຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/Blueberry-Smoothie.jpg" },
        { name: "Strawberry Smoothie", local: "ສະຕໍເບີຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/Strawberry-smoothie.jpg" },
        { name: "Cranberry Smoothie", local: "ແຄນເບຣີ້ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/cranberry-smoothie.jpg" },
        { name: "Avocado + Banana Smoothie", local: "ອາໂວຄາໂດ້ + ກ້ວຍ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/avocado-banana-smoothie.jpg" },
        { name: "Apple + Kale Smoothie", local: "ແອັບເປິ້ນ + ເຄວ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/Apple-Kale-Smoothie.jpg" },
        { name: "Apple + Green Mixed Smoothie", local: "ແອັບເປິ້ນ + ຜັກລວມ ສະມູດຕີ້", vars: ["Blended"], img: "/uploads/apple-green-mixed-smoothie.jpg" },
    ]
    for (const m of smoothieList) {
        await seedMenu(m.name, m.local, "Smoothie", m.vars, m.img, false, 40000)
    }

    // 6. Premium
    const premiumList = [
        { name: "Premium Americano", local: "ພຣີມ້ຽມ ອາເມຣິກາໂນ່", vars: ["Hot", "Iced"], zero: false, img: "/uploads/Americano.jpeg" },
        { name: "Premium Espresso", local: "ພຣີມ້ຽມ ເອສເພຣສໂຊ່", vars: ["Iced"], zero: true, img: "/uploads/espresso.jpg" },
        { name: "Premium Cappuccino", local: "ພຣີມ້ຽມ ຄາປູຊີໂນ່", vars: ["Hot", "Iced"], zero: true, img: "/uploads/cappuccino.jpg" },
        { name: "Premium Latte", local: "ພຣີມ້ຽມ ລາເຕ້", vars: ["Hot", "Iced"], zero: true, img: "/uploads/latte.jpg" },
        { name: "Premium Pure Matcha", local: "ພຣີມ້ຽມ ພຽງມັດຊະ", vars: ["Iced"], zero: false, img: "/uploads/pure-matcha.png" },
        { name: "Premium Matcha Latte", local: "ພຣີມ້ຽມ ມັດຊະ ລາເຕ້", vars: ["Iced"], zero: true, img: "/uploads/matcha-latte.jpg" },
        { name: "Premium Matcha Latte Almond Milk", local: "ພຣີມ້ຽມ ມັດຊະ ລາເຕ້ ນົມອາວມ້ອນ", vars: ["Iced"], zero: true, img: "/uploads/matcha-latte-almond-milk.jpg" },
        { name: "Premium Matcha Latte Oat Milk", local: "ພຣີມ້ຽມ ມັດຊະ ລາເຕ້ ນົມໂອ້ດ", vars: ["Iced"], zero: true, img: "/uploads/Iced-Oat-Milk-Latte.png" },
        { name: "Premium Espresso Almond Milk", local: "ພຣີມ້ຽມ ເອສເພຣສໂຊ່ ນົມອາວມ້ອນ", vars: ["Iced"], zero: true, img: "/uploads/espresso-almond-milk.jpg" },
        { name: "Premium Latte Almond Milk", local: "ພຣີມ້ຽມ ລາເຕ້ ນົມອາວມ້ອນ", vars: ["Iced"], zero: true, img: "/uploads/premium-latte-almond-milk.jpg" },
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

    // ========== CUSTOMERS ==========
    console.log("Seeding customers...")
    const customersData = [
        { name: "John Doe", phone: "020 5555 1234", email: "john@example.com", loyaltyPoints: 150, totalSpent: 450000, visitCount: 15, type: "NORMAL" },
        { name: "Jane Smith", phone: "020 5555 5678", loyaltyPoints: 80, totalSpent: 240000, visitCount: 8, type: "NORMAL" },
        { name: "Bob Wilson", phone: "020 5555 9012", loyaltyPoints: 200, totalSpent: 600000, visitCount: 20, type: "NORMAL" },
        { name: "Owner VIP", phone: "000 000 0000", loyaltyPoints: 0, totalSpent: 0, visitCount: 0, type: "COMPLIMENTARY" }
    ]

    for (const data of customersData) {
        await prisma.customer.create({ data })
    }

    // ========== PROMOTIONS ==========
    console.log("Seeding promotions...")
    const promos = [
        {
            name: "New Year Sale",
            code: "NY2025",
            description: "10% off all orders",
            discountType: "percentage",
            discountValue: 10,
            startDate: subDays(now, 30),
            endDate: new Date(now.getFullYear(), 11, 31),
            isActive: true
        },
        {
            name: "Loyalty Bonus",
            code: "LOYAL50",
            description: "50,000 LAK off",
            discountType: "fixed",
            discountValue: 50000,
            startDate: subDays(now, 60),
            endDate: new Date(now.getFullYear() + 1, 5, 30),
            isActive: true
        }
    ]

    for (const p of promos) {
        await prisma.promotion.create({ data: p })
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
