import { Request, Response, NextFunction } from 'express';
import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export async function getWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      model: 'Product',
      select: 'title price images stock slug rating reviewCount isActive'
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    res.json({ success: true, data: wishlist.products });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!productId) {
      throw new ValidationError('Product ID is required');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const prodIdObj = product._id as any;
    if (wishlist.products.some((p) => p.toString() === productId)) {
      res.json({ success: true, message: 'Product already in wishlist', data: wishlist });
      return;
    }

    wishlist.products.push(prodIdObj);
    await wishlist.save();

    res.json({ success: true, message: 'Product added to wishlist', data: wishlist });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const productId = req.params.productId as string;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      throw new NotFoundError('Wishlist not found');
    }

    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
    await wishlist.save();

    res.json({ success: true, message: 'Product removed from wishlist', data: wishlist });
  } catch (error) {
    next(error);
  }
}
