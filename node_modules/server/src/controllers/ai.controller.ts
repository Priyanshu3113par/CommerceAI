import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';

export async function chatAssistant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    // Identify intent or extract key topics for semantic search
    let searchQuery = message;
    
    // Clean up conversational filler to improve vector/keyword matching
    const searchTerms = message
      .replace(/suggest|show me|find|i want|looking for|under|need/gi, '')
      .trim();
    
    if (searchTerms.length > 3) {
      searchQuery = searchTerms;
    }

    // Query products using our semantic product service (which falls back gracefully to text indexing)
    const searchResult = await productService.findAll({
      page: 1,
      limit: 3,
      search: searchQuery,
      sort: 'rating',
      semantic: true
    });

    const products = searchResult.products;

    let aiResponse = '';
    if (products && products.length > 0) {
      aiResponse = `Here are the top matches I found in our store for you:\n\n` +
        products.map((p: any, idx: number) => {
          const discountInfo = p.compareAtPrice && p.compareAtPrice > p.price
            ? ` (Save ${Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% OFF!)`
            : '';
          return `**${idx + 1}. [${p.title}](/products/${p.slug})** - **₹${p.price.toLocaleString('en-IN')}**${discountInfo}\n` +
                 `⭐ ${p.rating} / 5 (${p.reviewCount} reviews) - *${p.brand || 'Premium Brand'}*\n` +
                 `_${p.shortDescription || p.description.substring(0, 120) + '...'}_`;
        }).join('\n\n') + 
        `\n\nWould you like me to help you add any of these to your cart or compare their specifications?`;
    } else {
      aiResponse = `I couldn't find any products in our catalog matching "${message}" directly. \n\n` +
        `Try asking for specific categories like **Laptops**, **Smartphones**, **Fitness Gear**, or describe what you want (e.g. "coding laptop" or "wireless earphones").`;
    }

    res.json({
      success: true,
      message: aiResponse,
      products: products
    });
  } catch (error) {
    next(error);
  }
}
