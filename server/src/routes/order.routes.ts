import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Customer endpoints
router.post('/', orderController.placeOrder);
router.get('/', orderController.getOrderHistory);
router.get('/:id', orderController.getOrderDetails);

// Admin endpoints
router.get('/admin/all', authorize('admin'), orderController.getAllOrdersAdmin);
router.put('/:id/status', authorize('admin'), orderController.updateOrderStatus);

export default router;
