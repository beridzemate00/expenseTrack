import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../controllers/transaction.controller';
import { exportToCSV, exportToHTML } from '../controllers/export.controller';

const router = Router();

router.use(authenticate);

router.get('/export', exportToCSV);
router.get('/export/report', exportToHTML);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
