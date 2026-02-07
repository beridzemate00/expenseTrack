import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import budgetRoutes from './routes/budget.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Expense Tracker API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export { prisma };
