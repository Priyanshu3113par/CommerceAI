import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
let fallbackMode = false;
let seeded = false;
const users = [];
const categories = [];
const products = [];
const carts = new Map();
const wishlists = new Map();
const orders = [];
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
function ensureSeeded() {
    if (seeded)
        return;
    seeded = true;
    const seedCategories = [
        { name: 'Electronics', description: 'Smartphones, laptops, tablets and gadgets', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
        { name: 'Fashion', description: 'Clothing, footwear and accessories', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
        { name: 'Home & Kitchen', description: 'Furniture, appliances and home essentials', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400' },
        { name: 'Sports & Fitness', description: 'Sports gear, fitness equipment and outdoor', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' },
    ];
    seedCategories.forEach((entry) => {
        categories.push({
            _id: randomUUID(),
            name: entry.name,
            slug: slugify(entry.name),
            description: entry.description,
            image: entry.image,
            isActive: true,
        });
    });
    const seedProducts = [
        {
            title: 'MacBook Air M3',
            categoryName: 'Electronics',
            price: 114900,
            compareAtPrice: 124900,
            stock: 25,
            isFeatured: true,
            tags: ['laptop', 'apple', 'coding', 'lightweight'],
            shortDescription: 'Ultra-light laptop with M3 chip, perfect for developers.',
            description: 'The MacBook Air with M3 chip delivers incredible performance in an impossibly thin design.',
            images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
            brand: 'Apple',
            rating: 4.8,
            reviewCount: 42,
        },
        {
            title: 'Sony WH-1000XM5 Headphones',
            categoryName: 'Electronics',
            price: 29990,
            compareAtPrice: 34990,
            stock: 40,
            isFeatured: true,
            tags: ['headphones', 'wireless', 'noise-cancelling'],
            shortDescription: 'Industry-leading noise cancellation with premium sound.',
            description: 'Experience unparalleled noise cancellation with the Sony WH-1000XM5.',
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
            brand: 'Sony',
            rating: 4.7,
            reviewCount: 31,
        },
        {
            title: 'Nike Air Max 270',
            categoryName: 'Fashion',
            price: 12995,
            compareAtPrice: 14995,
            stock: 80,
            isFeatured: true,
            tags: ['shoes', 'running', 'comfortable', 'walking'],
            shortDescription: 'Max Air cushioning for all-day comfort.',
            description: 'Nike Air Max 270 delivers visible cushioning under every step.',
            images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
            brand: 'Nike',
            rating: 4.6,
            reviewCount: 19,
        },
        {
            title: 'Instant Pot Duo 7-in-1',
            categoryName: 'Home & Kitchen',
            price: 8999,
            compareAtPrice: 10999,
            stock: 35,
            isFeatured: true,
            tags: ['kitchen', 'cooker', 'appliance'],
            shortDescription: '7-in-1 electric pressure cooker for quick meals.',
            description: 'Instant Pot Duo replaces 7 kitchen appliances.',
            images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'],
            brand: 'Instant Pot',
            rating: 4.5,
            reviewCount: 27,
        },
        {
            title: 'Yoga Mat Pro',
            categoryName: 'Sports & Fitness',
            price: 3499,
            stock: 50,
            isFeatured: true,
            tags: ['fitness', 'yoga', 'mat'],
            shortDescription: 'Premium grip mat for home workouts and yoga.',
            description: 'A high-density mat with excellent grip for all workout styles.',
            images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'],
            brand: 'Lululemon',
            rating: 4.4,
            reviewCount: 15,
        },
    ];
    seedProducts.forEach((entry) => {
        const category = categories.find((item) => item.name === entry.categoryName);
        products.push({
            _id: randomUUID(),
            title: entry.title,
            slug: slugify(entry.title),
            description: entry.description,
            shortDescription: entry.shortDescription,
            price: entry.price,
            compareAtPrice: entry.compareAtPrice,
            category: category?.slug || 'electronics',
            images: entry.images,
            tags: entry.tags,
            brand: entry.brand,
            stock: entry.stock,
            rating: entry.rating,
            reviewCount: entry.reviewCount,
            isFeatured: entry.isFeatured,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    });
}
export function setFallbackMode(enabled) {
    fallbackMode = enabled;
}
export function isFallbackMode() {
    return fallbackMode || mongoose.connection.readyState !== 1;
}
export function getFallbackProducts(query) {
    ensureSeeded();
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const sort = query?.sort || 'newest';
    const search = query?.search?.toLowerCase() || '';
    const category = query?.category || '';
    const featured = Boolean(query?.featured);
    const brand = query?.brand?.toLowerCase() || '';
    let filtered = products.filter((product) => product.isActive);
    if (search) {
        filtered = filtered.filter((product) => {
            const haystack = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
            return haystack.includes(search);
        });
    }
    if (category) {
        filtered = filtered.filter((product) => product.category === category);
    }
    if (featured) {
        filtered = filtered.filter((product) => product.isFeatured);
    }
    if (brand) {
        filtered = filtered.filter((product) => product.brand?.toLowerCase().includes(brand));
    }
    const sorted = [...filtered].sort((a, b) => {
        switch (sort) {
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'name':
                return a.title.localeCompare(b.title);
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);
    return {
        products: items,
        meta: { page, limit, total: sorted.length, totalPages: Math.max(1, Math.ceil(sorted.length / limit)) },
    };
}
export function getFallbackProductBySlug(slug) {
    ensureSeeded();
    return products.find((product) => product.slug === slug && product.isActive);
}
export function createFallbackProduct(data) {
    ensureSeeded();
    const newProduct = {
        _id: randomUUID(),
        title: data.title,
        slug: slugify(data.title),
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        price: data.price || 0,
        compareAtPrice: data.compareAtPrice,
        category: data.category || 'electronics',
        images: data.images || [],
        tags: data.tags || [],
        brand: data.brand || '',
        stock: data.stock ?? 0,
        rating: 4.5,
        reviewCount: 0,
        isFeatured: Boolean(data.isFeatured),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    return newProduct;
}
export function updateFallbackProduct(id, data) {
    ensureSeeded();
    const product = products.find((entry) => entry._id === id);
    if (!product)
        return null;
    Object.assign(product, data, { updatedAt: new Date().toISOString() });
    return product;
}
export function deleteFallbackProduct(id) {
    ensureSeeded();
    const product = products.find((entry) => entry._id === id);
    if (!product)
        return false;
    product.isActive = false;
    return true;
}
export function getFallbackCategories() {
    ensureSeeded();
    return categories.filter((category) => category.isActive).sort((a, b) => a.name.localeCompare(b.name));
}
export function getFallbackUserByEmail(email) {
    ensureSeeded();
    return users.find((user) => user.email === email);
}
export function getFallbackUserById(id) {
    ensureSeeded();
    return users.find((user) => user.id === id);
}
export function createFallbackUser(input) {
    ensureSeeded();
    const user = {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role || 'customer',
        isActive: true,
    };
    users.push(user);
    return user;
}
export function updateFallbackUserRefreshToken(userId, refreshToken) {
    ensureSeeded();
    const user = users.find((entry) => entry.id === userId);
    if (!user)
        return null;
    user.refreshToken = refreshToken;
    return user;
}
export function clearFallbackUserRefreshToken(userId) {
    ensureSeeded();
    const user = users.find((entry) => entry.id === userId);
    if (!user)
        return null;
    user.refreshToken = undefined;
    return user;
}
export function getOrCreateFallbackCart(userId) {
    ensureSeeded();
    if (!carts.has(userId)) {
        carts.set(userId, { _id: randomUUID(), user: userId, items: [] });
    }
    return carts.get(userId);
}
export function getFallbackCart(userId) {
    ensureSeeded();
    return carts.get(userId) || { _id: randomUUID(), user: userId, items: [] };
}
export function updateFallbackCart(userId, updater) {
    ensureSeeded();
    const cart = getOrCreateFallbackCart(userId);
    const nextCart = updater(cart);
    carts.set(userId, nextCart);
    return nextCart;
}
export function getOrCreateFallbackWishlist(userId) {
    ensureSeeded();
    if (!wishlists.has(userId)) {
        wishlists.set(userId, { _id: randomUUID(), user: userId, products: [] });
    }
    return wishlists.get(userId);
}
export function updateFallbackWishlist(userId, updater) {
    ensureSeeded();
    const wishlist = getOrCreateFallbackWishlist(userId);
    const nextWishlist = updater(wishlist);
    wishlists.set(userId, nextWishlist);
    return nextWishlist;
}
export function createFallbackOrder(input) {
    ensureSeeded();
    orders.push(input);
    return input;
}
export function getFallbackOrdersForUser(userId) {
    ensureSeeded();
    return orders.filter((order) => order.user === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function getFallbackAllOrders() {
    ensureSeeded();
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function updateFallbackOrderStatus(orderId, status) {
    ensureSeeded();
    const order = orders.find((entry) => entry._id === orderId);
    if (!order)
        return null;
    order.status = status;
    return order;
}
export function getFallbackDashboardStats() {
    ensureSeeded();
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const lowStockCount = products.filter((product) => product.stock <= 5).length;
    return {
        totalRevenue,
        ordersCount: orders.length,
        avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
        customerCount: users.filter((user) => user.role === 'customer').length,
        lowStockCount,
        totalProductCount: products.filter((product) => product.isActive).length,
    };
}
export function getFallbackSalesReports() {
    ensureSeeded();
    const salesByCategory = categories.map((category) => ({ _id: category.name, revenue: 0, salesCount: 0 }));
    const monthlySales = [];
    return { salesByCategory, monthlySales };
}
export function getFallbackInventoryReports() {
    ensureSeeded();
    return {
        totalProducts: products.filter((product) => product.isActive).length,
        totalStock: products.reduce((sum, product) => sum + (product.isActive ? product.stock : 0), 0),
        totalValue: products.reduce((sum, product) => sum + (product.isActive ? product.price * product.stock : 0), 0),
        avgPrice: products.length ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0,
        lowStockItems: products.filter((product) => product.isActive && product.stock <= 5),
    };
}
