import { FilterQuery, SortOrder } from 'mongoose';
import { Product, IProductDocument } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { slugify } from '../utils/helpers.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { getCache, setCache, delCache, invalidateProducts } from '../config/redis.js';
import { getEmbedding } from './embedding.service.js';
import {
  getFallbackProducts,
  getFallbackProductBySlug,
  createFallbackProduct,
  updateFallbackProduct,
  deleteFallbackProduct,
  isFallbackMode,
} from '../config/fallbackStore.js';

interface ProductQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  featured?: boolean;
  brand?: string;
  semantic?: boolean;
}

export class ProductService {
  async findAll(query: ProductQuery) {
    const cacheKey = `products:list:${JSON.stringify(query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback if parsing fails
      }
    }

    if (isFallbackMode()) {
      return getFallbackProducts(query);
    }

    const { page, limit, search, category, minPrice, maxPrice, sort, featured, brand, semantic } = query;
    const filter: FilterQuery<IProductDocument> = { isActive: true };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (featured) filter.isFeatured = true;
    if (brand) filter.brand = new RegExp(brand, 'i');

    const sortMap: Record<string, Record<string, SortOrder>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
      name: { title: 1 },
    };

    let products: any[] = [];
    let total = 0;
    let vectorSearchSuccess = false;

    if (search && semantic) {
      try {
        const queryVector = await getEmbedding(search);
        const pipeline: any[] = [
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: queryVector,
              numCandidates: 100,
              limit: limit * page,
              filter: filter,
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category'
            }
          },
          { $unwind: '$category' },
          { $skip: (page - 1) * limit },
          { $limit: limit }
        ];

        products = await Product.aggregate(pipeline);
        total = await Product.countDocuments(filter);
        vectorSearchSuccess = true;
      } catch (err) {
        console.warn('MongoDB Vector Search not available. Falling back to keyword search:', err);
      }
    }

    if (!vectorSearchSuccess) {
      if (search) {
        filter.$text = { $search: search };
      }

      const skip = (page - 1) * limit;
      [products, total] = await Promise.all([
        Product.find(filter)
          .populate('category', 'name slug')
          .sort(sortMap[sort] || sortMap.newest)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter),
      ]);
    }

    const result = {
      products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await setCache(cacheKey, JSON.stringify(result), 3600);

    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = `products:slug:${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback if parsing fails
      }
    }

    if (isFallbackMode()) {
      const product = getFallbackProductBySlug(slug);
      if (!product) throw new NotFoundError('Product not found');
      return product;
    }

    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .lean();
    if (!product) throw new NotFoundError('Product not found');

    await setCache(cacheKey, JSON.stringify(product), 86400);

    return product;
  }

  async findById(id: string) {
    const cacheKey = `products:id:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback if parsing fails
      }
    }

    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) throw new NotFoundError('Product not found');

    await setCache(cacheKey, JSON.stringify(product), 86400);

    return product;
  }

  async create(data: Record<string, unknown>) {
    if (isFallbackMode()) {
      return createFallbackProduct(data);
    }

    const slug = slugify(data.title as string);
    const existing = await Product.findOne({ slug });
    if (existing) throw new ConflictError('Product with this title already exists');

    // Generate embedding for Vector Search
    const textToEmbed = `${data.title} ${data.shortDescription || ''} ${data.description || ''}`;
    const embedding = await getEmbedding(textToEmbed);

    const product = await Product.create({ ...data, slug, embedding });

    await invalidateProducts();

    return product;
  }

  async update(id: string, data: Record<string, unknown>) {
    if (isFallbackMode()) {
      const updated = updateFallbackProduct(id, data);
      if (!updated) throw new NotFoundError('Product not found');
      return updated;
    }

    if (data.title) {
      data.slug = slugify(data.title as string);
    }

    if (data.title !== undefined || data.description !== undefined || data.shortDescription !== undefined) {
      const existing = await Product.findById(id);
      if (!existing) throw new NotFoundError('Product not found');

      const title = data.title !== undefined ? data.title : existing.title;
      const desc = data.description !== undefined ? data.description : existing.description;
      const shortDesc = data.shortDescription !== undefined ? data.shortDescription : existing.shortDescription;

      const textToEmbed = `${title} ${shortDesc || ''} ${desc}`;
      data.embedding = await getEmbedding(textToEmbed);
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');
    if (!product) throw new NotFoundError('Product not found');

    await delCache(`products:id:${product._id}`);
    await delCache(`products:slug:${product.slug}`);
    await invalidateProducts();

    return product;
  }

  async delete(id: string) {
    if (isFallbackMode()) {
      const deleted = deleteFallbackProduct(id);
      if (!deleted) throw new NotFoundError('Product not found');
      return { success: true };
    }

    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) throw new NotFoundError('Product not found');

    await delCache(`products:id:${product._id}`);
    await delCache(`products:slug:${product.slug}`);
    await invalidateProducts();

    return product;
  }
}

export const productService = new ProductService();
