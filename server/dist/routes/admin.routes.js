import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/dashboard', adminController.getDashboardStats);
router.get('/sales', adminController.getSalesReports);
router.get('/inventory', adminController.getInventoryReports);
export default router;
