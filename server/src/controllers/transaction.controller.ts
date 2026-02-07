import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const getTransactions = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        let transactions;
        if (userRole === 'ADMIN') {
            transactions = await prisma.transaction.findMany({
                include: { user: { select: { name: true, email: true } } },
                orderBy: { date: 'desc' }
            });
        } else {
            transactions = await prisma.transaction.findMany({
                where: { userId },
                orderBy: { date: 'desc' }
            });
        }
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
    const { amount, description, category, type, date } = req.body;
    const userId = req.user?.userId;

    try {
        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                description,
                category,
                type,
                date: date ? new Date(date) : new Date(),
                userId: userId!
            }
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error creating transaction' });
    }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { amount, description, category, type, date } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const existing = await prisma.transaction.findUnique({ where: { id: id as string } });
        if (!existing) return res.status(404).json({ message: 'Not found' });

        if (userRole !== 'ADMIN' && existing.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const transaction = await prisma.transaction.update({
            where: { id: id as string },
            data: {
                amount: amount ? parseFloat(amount) : undefined,
                description,
                category,
                type,
                date: date ? new Date(date) : undefined
            }
        });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error updating transaction' });
    }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const existing = await prisma.transaction.findUnique({ where: { id: id as string } });
        if (!existing) return res.status(404).json({ message: 'Not found' });

        if (userRole !== 'ADMIN' && existing.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await prisma.transaction.delete({ where: { id: id as string } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction' });
    }
};
