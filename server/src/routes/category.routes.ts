import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCategories);
router.post('/', authenticate, createCategory);

export default router;
