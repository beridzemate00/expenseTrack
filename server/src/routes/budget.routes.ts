import { Router } from 'express';
import { getBudgets, setBudget } from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getBudgets);
router.post('/', authenticate, setBudget);

export default router;
