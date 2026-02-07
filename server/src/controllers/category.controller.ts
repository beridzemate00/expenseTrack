import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const getCategories = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    try {
        const categories = await prisma.category.findMany({
            where: {
                OR: [
                    { userId: null },
                    { userId: userId }
                ]
            },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    const { name, type } = req.body;
    const userId = req.user?.userId;

    try {
        const category = await prisma.category.create({
            data: {
                name,
                type,
                userId: userId!
            }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category' });
    }
};
