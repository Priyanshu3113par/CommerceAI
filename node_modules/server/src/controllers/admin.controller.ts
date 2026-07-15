import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [orderStatsResult, customerCount, lowStockCount, totalProductCount] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'pending'] }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            ordersCount: { $sum: 1 },
            avgOrderValue: { $avg: '$total' },
          },
        },
      ]),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ stock: { $lte: 5 }, isActive: true }),
      Product.countDocuments({ isActive: true }),
    ]);

    const orderStats = orderStatsResult[0] || {
      totalRevenue: 0,
      ordersCount: 0,
      avgOrderValue: 0,
    };

    res.json({
      success: true,
      data: {
        totalRevenue: Math.round(orderStats.totalRevenue * 100) / 100,
        ordersCount: orderStats.ordersCount,
        avgOrderValue: Math.round(orderStats.avgOrderValue * 100) / 100,
        customerCount,
        lowStockCount,
        totalProductCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesReports(req: Request, res: Response, next: NextFunction) {
  try {
    const [salesByCategory, monthlySales] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        { $unwind: '$productDetails' },
        {
          $lookup: {
            from: 'categories',
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        { $unwind: '$categoryDetails' },
        {
          $group: {
            _id: '$categoryDetails.name',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            salesCount: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$total' },
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Format monthly sales for easier charting
    const formattedMonthly = monthlySales.map((m) => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return {
        label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
        revenue: Math.round(m.revenue * 100) / 100,
        ordersCount: m.ordersCount,
      };
    });

    res.json({
      success: true,
      data: {
        salesByCategory,
        monthlySales: formattedMonthly,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryReports(req: Request, res: Response, next: NextFunction) {
  try {
    const [inventoryStatsResult, lowStockItems] = await Promise.all([
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
            avgPrice: { $avg: '$price' },
          },
        },
      ]),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .populate('category', 'name')
        .sort({ stock: 1 })
        .lean(),
    ]);

    const inventoryStats = inventoryStatsResult[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      avgPrice: 0,
    };

    res.json({
      success: true,
      data: {
        totalProducts: inventoryStats.totalProducts,
        totalStock: inventoryStats.totalStock,
        totalValue: Math.round(inventoryStats.totalValue * 100) / 100,
        avgPrice: Math.round(inventoryStats.avgPrice * 100) / 100,
        lowStockItems,
      },
    });
  } catch (error) {
    next(error);
  }
}
