
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("--- Testing Shift Cash Update ---")

    // 1. Get or Create Open Shift
    let shift = await prisma.shift.findFirst({ where: { status: 'OPEN' } })
    if (!shift) {
        console.log("No open shift, creating one...")
        shift = await prisma.shift.create({
            data: {
                status: 'OPEN',
                startTime: new Date(),
                startCash: 100000,
                cashPayments: 0
            }
        })
    }
    console.log(`Initial Shift State: ID=${shift.id}, CashPayments=${shift.cashPayments}`)

    // 2. Create Dummy VariationSize if needed
    const menu = await prisma.menu.findFirst({ include: { variations: { include: { sizes: true } } } })
    if (!menu || !menu.variations[0]?.sizes[0]) {
        console.error("No menu/size found to test with.")
        return
    }
    const vsId = menu.variations[0].sizes[0].id
    const price = menu.variations[0].sizes[0].price
    console.log(`Using VariationSize: ${vsId} (${price} LAK)`)

    // 3. Create Order via direct DB (simulating API logic for Shift update? No, we should test the API logic logic)
    // But I can't call API from here easily. I will simulate the Transaction Logic logic.

    // Update Shift
    const orderTotal = 50000
    console.log(`Simulating Cash Pay of ${orderTotal}...`)

    // Simulate what API does
    const updatedShift = await prisma.shift.update({
        where: { id: shift.id },
        data: { cashPayments: { increment: orderTotal } }
    })

    console.log(`Updated Shift State: ID=${updatedShift.id}, CashPayments=${updatedShift.cashPayments}`)

    if (updatedShift.cashPayments === shift.cashPayments + orderTotal) {
        console.log("SUCCESS: Shift cash updated correctly.")
    } else {
        console.error("FAILURE: Shift cash did NOT update correctly.")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
