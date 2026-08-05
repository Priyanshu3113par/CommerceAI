import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/auth.js';
const demoCategories = [
    {
        name: 'Electronics',
        description: 'Smartphones, laptops, tablets and gadgets',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    },
    {
        name: 'Fashion',
        description: 'Clothing, footwear and accessories',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    },
    {
        name: 'Home & Kitchen',
        description: 'Furniture, appliances and home essentials',
        image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
    },
    {
        name: 'Sports & Fitness',
        description: 'Sports gear, fitness equipment and outdoor',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    },
];
const demoProducts = [
    {
        title: 'MacBook Air M3',
        brand: 'Apple',
        categoryName: 'Electronics',
        price: 114900,
        compareAtPrice: 124900,
        stock: 25,
        isFeatured: true,
        tags: ['laptop', 'apple', 'coding', 'lightweight'],
        shortDescription: 'Ultra-light laptop with M3 chip, perfect for developers.',
        description: 'The MacBook Air with M3 chip delivers incredible performance in an impossibly thin design. 18-hour battery life, stunning Liquid Retina display, and silent fanless operation make it ideal for coding, design, and everyday productivity.',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    },
    {
        title: 'Sony WH-1000XM5 Headphones',
        brand: 'Sony',
        categoryName: 'Electronics',
        price: 29990,
        compareAtPrice: 34990,
        stock: 40,
        isFeatured: true,
        tags: ['headphones', 'wireless', 'noise-cancelling'],
        shortDescription: 'Industry-leading noise cancellation with premium sound.',
        description: 'Experience unparalleled noise cancellation with the Sony WH-1000XM5. 30-hour battery, multipoint connection, and crystal-clear call quality. Perfect for travel, work, and immersive music listening.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    },
    {
        title: 'Nike Air Max 270',
        brand: 'Nike',
        categoryName: 'Fashion',
        price: 12995,
        compareAtPrice: 14995,
        stock: 80,
        isFeatured: true,
        tags: ['shoes', 'running', 'comfortable', 'walking'],
        shortDescription: 'Max Air cushioning for all-day comfort.',
        description: 'Nike Air Max 270 delivers visible cushioning under every step. Breathable mesh upper, foam midsole, and rubber outsole provide comfort for daily walking and light running.',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
    },
    {
        title: 'Instant Pot Duo 7-in-1',
        brand: 'Instant Pot',
        categoryName: 'Home & Kitchen',
        price: 8999,
        compareAtPrice: 10999,
        stock: 35,
        isFeatured: true,
        tags: ['kitchen', 'cooker', 'appliance'],
        shortDescription: '7-in-1 electric pressure cooker for quick meals.',
        description: 'Instant Pot Duo replaces 7 kitchen appliances. Pressure cook, slow cook, rice cooker, steamer, sauté, yogurt maker, and warmer. 6-quart capacity feeds up to 6 people.',
        images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'],
    },
    {
        title: 'Yoga Mat Pro',
        brand: 'Lululemon',
        categoryName: 'Sports & Fitness',
        price: 3499,
        stock: 50,
        isFeatured: true,
        tags: ['fitness', 'yoga', 'mat'],
        shortDescription: 'Premium grip mat for home workouts and yoga.',
        description: 'A high-density mat with excellent grip for all workout styles, from hot yoga to strength training.',
        images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'],
    },
];
export async function seedDemoData() {
    const existingCategories = await Category.countDocuments();
    if (existingCategories === 0) {
        for (const entry of demoCategories) {
            await Category.create(entry);
        }
    }
    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
        const categories = await Category.find({ isActive: true }).lean();
        const categoryByName = new Map(categories.map((category) => [category.name, category._id]));
        for (const entry of demoProducts) {
            await Product.create({
                ...entry,
                slug: entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                description: entry.description,
                category: categoryByName.get(entry.categoryName),
                rating: 4.5,
                reviewCount: 12,
            });
        }
    }
    const existingAdmin = await User.findOne({ email: 'admin@commerceai.com' });
    if (!existingAdmin) {
        const hashedPassword = await hashPassword('Admin123!');
        await User.create({
            name: 'Admin User',
            email: 'admin@commerceai.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
        });
    }
}
