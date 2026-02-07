import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../controllers/transaction.controller';
import { exportToCSV } from '../controllers/export.controller';

const router = Router();

router.use(authenticate);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.get('/export', exportToCSV);

export default router;
