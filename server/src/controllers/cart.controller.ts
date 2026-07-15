import { Request, Response, NextFunction } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const populatedCart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
      select: 'title price images stock slug isActive'
    });

    if (!populatedCart) {
      throw new NotFoundError('Cart not found');
    }

    const activeItems = populatedCart.items.filter(
      (item) => item.product && (item.product as any).isActive
    );

    let subtotal = 0;
    const items = activeItems.map((item) => {
      const prod = item.product as any;
      const price = prod.price;
      const quantity = item.quantity;
      const totalItemPrice = price * quantity;
      subtotal += totalItemPrice;

      return {
        product: {
          _id: prod._id,
          title: prod.title,
          price: prod.price,
          images: prod.images,
          stock: prod.stock,
          slug: prod.slug,
        },
        quantity,
        price,
      };
    });

    const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + shipping + tax;

    res.json({
      success: true,
      data: {
        _id: cart._id,
        user: cart.user,
        items,
        subtotal,
        shipping,
        tax,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      throw new ValidationError('Invalid product ID or quantity');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock < quantity) {
      throw new ValidationError(`Only ${product.stock} items left in stock`);
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQty) {
        throw new ValidationError(`Cannot add more. Only ${product.stock} items available in stock`);
      }
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({
        product: product._id as any,
        quantity,
        price: product.price,
      });
    }

    await cart.save();
    res.json({ success: true, message: 'Item added to cart', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function updateCartItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const productId = req.params.productId as string;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      throw new ValidationError('Quantity must be at least 1');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock < quantity) {
      throw new ValidationError(`Only ${product.stock} items available in stock`);
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      throw new NotFoundError('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;
    await cart.save();

    res.json({ success: true, message: 'Cart updated', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function removeCartItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const productId = req.params.productId as string;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    res.json({ success: true, message: 'Item removed from cart', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
}
