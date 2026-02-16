const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
    const menus = await prisma.menu.findMany({
        take: 5,
        select: {
            name: true,
            localName: true,
            category: {
                select: { name: true }
            }
        }
    })
    console.log("Sample Database Items:")
    console.table(menus)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
