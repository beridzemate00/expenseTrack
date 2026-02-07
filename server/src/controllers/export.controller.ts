import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { stringify } from 'csv-stringify/sync';

export const exportToCSV = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        let transactions;
        if (userRole === 'ADMIN') {
            transactions = await prisma.transaction.findMany({
                include: {
                    user: { select: { email: true } },
                    category: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });
        } else {
            transactions = await prisma.transaction.findMany({
                where: { userId },
                include: { category: { select: { name: true } } },
                orderBy: { date: 'desc' }
            });
        }

        const data = transactions.map((t: any) => ({
            Date: (t.date as Date).toISOString().split('T')[0],
            Type: t.type,
            Category: t.category?.name || 'N/A',
            Amount: t.amount,
            Description: t.description,
            User: t.user?.email || 'Self'
        }));

        const csv = stringify(data, { header: true });
        const bom = '\uFEFF';
        console.log(`Exporting ${data.length} transactions as CSV`);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.status(200).send(bom + csv);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting data' });
    }
};
