import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const getBudgets = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { month, year } = req.query;

    try {
        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                month: month ? parseInt(month as string) : new Date().getMonth() + 1,
                year: year ? parseInt(year as string) : new Date().getFullYear()
            },
            include: { category: { select: { name: true } } }
        });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching budgets' });
    }
};

export const setBudget = async (req: AuthRequest, res: Response) => {
    const { limit, categoryId, month, year } = req.body;
    const userId = req.user?.userId;

    try {
        const budget = await prisma.budget.upsert({
            where: {
                userId_categoryId_month_year: {
                    userId: userId!,
                    categoryId,
                    month,
                    year
                }
            },
            update: { limit: parseFloat(limit) },
            create: {
                limit: parseFloat(limit),
                categoryId,
                month,
                year,
                userId: userId!
            }
        });
        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Error setting budget' });
    }
};
