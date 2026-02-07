import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);

    const user1 = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
        },
    });

    const userPassword = await bcrypt.hash('user123', 10);
    const user2 = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            password: userPassword,
            name: 'Regular User',
            role: 'USER',
        },
    });

    const categories = [
        { name: 'Salary', type: 'INCOME' as const },
        { name: 'Freelance', type: 'INCOME' as const },
        { name: 'Investments', type: 'INCOME' as const },
        { name: 'Food', type: 'EXPENSE' as const },
        { name: 'Rent', type: 'EXPENSE' as const },
        { name: 'Transport', type: 'EXPENSE' as const },
        { name: 'Entertainment', type: 'EXPENSE' as const },
        { name: 'Shopping', type: 'EXPENSE' as const },
        { name: 'Health', type: 'EXPENSE' as const },
        { name: 'General', type: 'EXPENSE' as const },
    ];

    for (const cat of categories) {
        const existing = await prisma.category.findFirst({
            where: { name: cat.name, userId: null }
        });

        if (!existing) {
            await prisma.category.create({
                data: {
                    name: cat.name,
                    type: cat.type,
                    userId: null,
                },
            });
        }
    }

    console.log('Seed completed: admin@example.com / admin123, user@example.com / user123, and default categories.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
