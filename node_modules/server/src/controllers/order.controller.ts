import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { invalidateProducts } from '../config/redis.js';

export async function placeOrder(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const { shippingAddress } = req.body;

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
    return next(new ValidationError('Missing required shipping address fields'));
  }

  const decrementedItems: { productId: string; quantity: number }[] = [];

  try {
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product'
    });

    if (!cart || cart.items.length === 0) {
      throw new ValidationError('Your cart is empty');
    }

    const activeItems = cart.items.filter(
      (item) => item.product && (item.product as any).isActive
    );

    if (activeItems.length === 0) {
      throw new ValidationError('All products in your cart are currently unavailable');
    }

    for (const item of activeItems) {
      const prod = item.product as any;
      
      const updateResult = await Product.findOneAndUpdate(
        { _id: prod._id, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updateResult) {
        throw new ValidationError(`Insufficient inventory for product: ${prod.title}`);
      }

      decrementedItems.push({ productId: prod._id.toString(), quantity: item.quantity });
    }

    let subtotal = 0;
    const orderItems = activeItems.map((item) => {
      const prod = item.product as any;
      const price = prod.price;
      const quantity = item.quantity;
      subtotal += price * quantity;

      return {
        product: prod._id,
        title: prod.title,
        quantity,
        price,
        image: prod.images?.[0] || '',
      };
    });

    const shipping = subtotal > 1000 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + shipping + tax;

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await Order.create({
      user: userId,
      orderNumber,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
      paymentStatus: 'paid', // Mark as paid for demo simplicity
      status: 'confirmed',
    });

    cart.items = [];
    await cart.save();

    await invalidateProducts();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    for (const rolled of decrementedItems) {
      try {
        await Product.findByIdAndUpdate(rolled.productId, { $inc: { stock: rolled.quantity } });
      } catch (rollErr) {
        console.error('Failed to rollback stock during checkout error:', rollErr);
      }
    }
    next(error);
  }
}

export async function getOrderHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrderDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const order = await Order.findById(req.params.id as string);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (req.user?.role !== 'admin' && order.user.toString() !== userId) {
      throw new ValidationError('Unauthorized access to order details');
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function getAllOrdersAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    res.json({
      success: true,
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status type');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const oldStatus = order.status;
    order.status = status;

    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
      order.paymentStatus = 'refunded';
      await invalidateProducts();
    } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
      order.paymentStatus = 'paid';
      await invalidateProducts();
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}
