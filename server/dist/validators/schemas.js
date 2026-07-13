import { z } from 'zod';
export const registerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});
export const createProductSchema = z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().min(10).max(5000),
    shortDescription: z.string().max(300).optional(),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    category: z.string().min(1),
    images: z.array(z.string().url().or(z.string().min(1))).optional(),
    tags: z.array(z.string()).optional(),
    brand: z.string().trim().optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().min(0).optional(),
    isFeatured: z.boolean().optional(),
});
export const updateProductSchema = createProductSchema.partial();
export const productQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'name']).default('newest'),
    featured: z.coerce.boolean().optional(),
    brand: z.string().optional(),
});
