import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { hashPassword } from '../utils/auth.js';
import { slugify } from '../utils/helpers.js';
import { getEmbedding } from '../services/embedding.service.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in server/.env');
  process.exit(1);
}

const categories = [
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
  {
    name: 'Books',
    description: 'Books, e-readers and stationery',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
  },
  {
    name: 'Beauty',
    description: 'Skincare, makeup and personal care',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  },
];

const products = [
  // --- ELECTRONICS ---
  {
    title: 'MacBook Air M3 13"',
    brand: 'Apple',
    category: 'Electronics',
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
    category: 'Electronics',
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
    title: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'Electronics',
    price: 129999,
    stock: 15,
    isFeatured: true,
    tags: ['smartphone', 'photography', 'android', 'flagship'],
    shortDescription: '200MP camera system for professional photography.',
    description: 'Galaxy S24 Ultra features a 200MP main camera, S Pen integration, and Galaxy AI. Titanium frame, 6.8" Dynamic AMOLED display, and all-day battery make it the ultimate productivity and photography phone.',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'],
  },
  {
    title: 'ASUS ROG Zephyrus G14',
    brand: 'ASUS',
    category: 'Electronics',
    price: 89990,
    compareAtPrice: 99990,
    stock: 12,
    tags: ['gaming', 'laptop', 'rtx'],
    shortDescription: 'Compact gaming laptop with RTX 4060 graphics.',
    description: 'ROG Zephyrus G14 packs RTX 4060 graphics and AMD Ryzen 9 into a 14" chassis weighing just 1.65kg. AniMe Matrix display, 165Hz refresh rate, and advanced cooling for serious gaming on the go.',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'],
  },
  {
    title: 'iPhone 15 Pro Max',
    brand: 'Apple',
    category: 'Electronics',
    price: 159900,
    stock: 20,
    tags: ['smartphone', 'apple', 'ios', 'flagship'],
    shortDescription: 'Titanium design with A17 Pro chip and 5x Telephoto camera.',
    description: 'iPhone 15 Pro Max features a strong and light aerospace-grade titanium design. Powered by the groundbreaking A17 Pro chip, it brings console gaming to mobile. Upgraded 5x zoom lens offers unmatched detail from a distance.',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'],
  },
  {
    title: 'Logitech MX Master 3S',
    brand: 'Logitech',
    category: 'Electronics',
    price: 9995,
    stock: 45,
    tags: ['mouse', 'wireless', 'productivity'],
    shortDescription: 'Premium wireless mouse for professionals.',
    description: 'MX Master 3S features an 8000 DPI sensor, quiet clicks, and MagSpeed electromagnetic scroll wheel. Works on any surface including glass. Up to 70 days on a full charge.',
    images: ['https://images.unsplash.com/photo-1527864554087-7fb91e9a8d36?w=600'],
  },
  {
    title: 'Kindle Paperwhite',
    brand: 'Amazon',
    category: 'Electronics',
    price: 13999,
    compareAtPrice: 15999,
    stock: 30,
    tags: ['ereader', 'kindle', 'books'],
    shortDescription: '6.8" glare-free display with adjustable warm light.',
    description: 'Kindle Paperwhite with 6.8" display, 300 ppi, and adjustable warm light. Waterproof (IPX8), 10-week battery life, and 16GB storage for thousands of books.',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],
  },
  {
    title: 'Dell XPS 15 Laptop',
    brand: 'Dell',
    category: 'Electronics',
    price: 165000,
    stock: 8,
    tags: ['laptop', 'dell', 'programming', 'creator'],
    shortDescription: 'High-performance creator laptop with InfinityEdge display.',
    description: 'Dell XPS 15 features a stunning 15.6-inch 3.5K OLED InfinityEdge display. Powered by 13th Gen Intel Core i7 and NVIDIA RTX 4050, it is built for massive workflows, software engineering, and content creation.',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'],
  },
  {
    title: 'iPad Air M1',
    brand: 'Apple',
    category: 'Electronics',
    price: 54900,
    compareAtPrice: 59900,
    stock: 18,
    tags: ['tablet', 'apple', 'ipad', 'm1'],
    shortDescription: 'Slim and versatile tablet with Apple M1 chip.',
    description: 'Apple iPad Air features a immersive 10.9-inch Liquid Retina display. The M1 chip brings desktop-class speed, making it a powerhouse for creative workflows, writing, and gaming.',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
  },
  {
    title: 'Nintendo Switch OLED',
    brand: 'Nintendo',
    category: 'Electronics',
    price: 32900,
    stock: 22,
    tags: ['gaming', 'console', 'nintendo'],
    shortDescription: 'Handheld gaming console with 7-inch OLED screen.',
    description: 'Enjoy vivid colors and crisp contrast with the Nintendo Switch OLED model. Featuring a wide adjustable stand, a wired LAN port dock, and 64GB of internal storage.',
    images: ['https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600'],
  },
  {
    title: 'Bose QuietComfort Earbuds II',
    brand: 'Bose',
    category: 'Electronics',
    price: 24900,
    stock: 35,
    tags: ['earbuds', 'wireless', 'music', 'bose'],
    shortDescription: 'Premium wireless earbuds with personalized noise cancellation.',
    description: 'Bose QuietComfort Earbuds II intelligently personalize the noise cancellation and sound performance to fit your ears, providing the world’s best noise reduction.',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
  },

  // --- FASHION ---
  {
    title: 'Classic Denim Jacket',
    brand: 'Levis',
    category: 'Fashion',
    price: 4999,
    stock: 60,
    tags: ['jacket', 'denim', 'casual'],
    shortDescription: 'Timeless denim jacket for everyday style.',
    description: 'Crafted from premium cotton denim with a classic fit. Features button closure, chest pockets, and adjustable waist tabs. A wardrobe essential that pairs with everything.',
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93dc?w=600'],
  },
  {
    title: 'Nike Air Max 270',
    brand: 'Nike',
    category: 'Fashion',
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
    title: 'Premium Cotton T-Shirt Pack',
    brand: 'H&M',
    category: 'Fashion',
    price: 1999,
    stock: 100,
    tags: ['tshirt', 'cotton', 'basics'],
    shortDescription: 'Pack of 3 soft cotton t-shirts in essential colors.',
    description: '100% organic cotton t-shirts in black, white, and navy. Regular fit, crew neck, and pre-shrunk fabric. Perfect everyday basics for your wardrobe.',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'],
  },
  {
    title: 'Minimalist Leather Wallet',
    brand: 'Bellroy',
    category: 'Fashion',
    price: 3499,
    stock: 55,
    tags: ['wallet', 'leather', 'accessories'],
    shortDescription: 'Slim leather wallet with RFID protection.',
    description: 'Premium full-grain leather wallet holds 4-12 cards plus bills. RFID-blocking lining, pull-tab for easy card access, and backed by 3-year warranty.',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=600'],
  },
  {
    title: 'Ray-Ban Wayfarer Sunglasses',
    brand: 'Ray-Ban',
    category: 'Fashion',
    price: 8500,
    compareAtPrice: 9900,
    stock: 30,
    tags: ['sunglasses', 'accessories', 'eyewear'],
    shortDescription: 'Iconic Wayfarer style with polarized lenses.',
    description: 'Ray-Ban Wayfarer Classic is the most recognizable style in the history of sunglasses. Polarized G-15 lenses provide high clarity and block out glare.',
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600'],
  },
  {
    title: 'Herschel Heritage Backpack',
    brand: 'Herschel',
    category: 'Fashion',
    price: 4500,
    stock: 45,
    tags: ['backpack', 'bag', 'travel'],
    shortDescription: 'Classic design with signature striped liner.',
    description: 'A classic silhouette with functional design. Features a 15-inch laptop sleeve, front utility pocket with key clip, and durable fabric structure.',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
  },
  {
    title: 'Adidas Ultraboost 1.0',
    brand: 'Adidas',
    category: 'Fashion',
    price: 17999,
    compareAtPrice: 19999,
    stock: 25,
    tags: ['shoes', 'sneakers', 'running', 'comfort'],
    shortDescription: 'Responsive boost cushioning with Primeknit upper.',
    description: 'Adidas Ultraboost shoes are built for high energy return. Continental rubber outsole provides grip, while the flexible Primeknit upper hugs your foot.',
    images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'],
  },
  {
    title: 'Fossil Chronograph Watch',
    brand: 'Fossil',
    category: 'Fashion',
    price: 11995,
    stock: 20,
    tags: ['watch', 'accessories', 'mens'],
    shortDescription: 'Quartz chronograph watch with stainless steel strap.',
    description: 'Fossil Machine watch features a rugged black steel bezel and quartz chronograph movement. Water-resistant up to 50m, perfect for casual and formal wear.',
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'],
  },

  // --- HOME & KITCHEN ---
  {
    title: 'Instant Pot Duo 7-in-1',
    brand: 'Instant Pot',
    category: 'Home & Kitchen',
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
    title: 'Dyson V15 Detect Vacuum',
    brand: 'Dyson',
    category: 'Home & Kitchen',
    price: 54900,
    stock: 10,
    tags: ['vacuum', 'cleaning', 'cordless'],
    shortDescription: 'Laser-detect cordless vacuum with HEPA filtration.',
    description: 'Dyson V15 Detect reveals hidden dust with a laser. Intelligent suction adapts to floor type. 60-minute runtime, whole-machine HEPA filtration, and LCD screen showing particle count.',
    images: ['https://images.unsplash.com/photo-1558317378-a6926a2a9342?w=600'],
  },
  {
    title: 'Ninja Foodi Air Fryer',
    brand: 'Ninja',
    category: 'Home & Kitchen',
    price: 12999,
    stock: 28,
    tags: ['air-fryer', 'kitchen', 'healthy-cooking'],
    shortDescription: '4-in-1 air fry, roast, reheat, and dehydrate.',
    description: 'Ninja Foodi 4-in-1 with 5-quart capacity. Air fry with up to 75% less fat. One-touch programs for fries, wings, and more. Dishwasher-safe basket and crisper plate.',
    images: ['https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600'],
  },
  {
    title: 'Keurig K-Elite Coffee Maker',
    brand: 'Keurig',
    category: 'Home & Kitchen',
    price: 15999,
    compareAtPrice: 18999,
    stock: 15,
    tags: ['coffee', 'kitchen', 'espresso'],
    shortDescription: 'Single-serve coffee brewer with iced setting.',
    description: 'The Keurig K-Elite brewer combines a premium finish and programmable features to deliver both modern design and ultimate beverage customization. Includes strong brew and iced coffee buttons.',
    images: ['https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600'],
  },
  {
    title: 'Vitamix Explorian Blender',
    brand: 'Vitamix',
    category: 'Home & Kitchen',
    price: 28900,
    stock: 12,
    tags: ['blender', 'kitchen', 'smoothie'],
    shortDescription: 'Professional-grade kitchen blender for smoothies and soups.',
    description: 'The Vitamix Explorian E310 offers ten variable speeds, pulse function, and a 48oz container. Perfect for blending thick smoothies, hot soups, frozen desserts, and batters.',
    images: ['https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=600'],
  },
  {
    title: 'iRobot Roomba 694 Vacuum',
    brand: 'iRobot',
    category: 'Home & Kitchen',
    price: 19999,
    stock: 24,
    tags: ['vacuum', 'smart-home', 'robotics'],
    shortDescription: 'Wi-Fi connected robotic vacuum cleaner.',
    description: 'The Roomba 694 robot vacuum cleans floors autonomously. Smart sensors navigate under furniture and around obstacles, compatible with Alexa and Google Assistant.',
    images: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600'],
  },
  {
    title: 'Lodge Cast Iron Skillet',
    brand: 'Lodge',
    category: 'Home & Kitchen',
    price: 2499,
    stock: 50,
    tags: ['cookware', 'skillet', 'kitchen'],
    shortDescription: 'Pre-seasoned 10.25-inch cast iron skillet.',
    description: 'Lodge cast iron skillet is pre-seasoned with 100% natural vegetable oil. Unparalleled heat retention and even heating makes it perfect for searing, baking, and frying.',
    images: ['https://images.unsplash.com/photo-1564844534614-b59e537c67b1?w=600'],
  },

  // --- SPORTS & FITNESS ---
  {
    title: 'Yoga Mat Pro 6mm',
    brand: 'Boldfit',
    category: 'Sports & Fitness',
    price: 1299,
    stock: 120,
    tags: ['yoga', 'fitness', 'mat'],
    shortDescription: 'Non-slip yoga mat with carrying strap.',
    description: 'Extra thick 6mm TPE yoga mat with superior grip and cushioning. Eco-friendly, lightweight, and includes free carrying strap. Ideal for yoga, pilates, and home workouts.',
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'],
  },
  {
    title: 'Adjustable Dumbbell Set 24kg',
    brand: 'Kore',
    category: 'Sports & Fitness',
    price: 14999,
    compareAtPrice: 18999,
    stock: 20,
    isFeatured: true,
    tags: ['dumbbell', 'home-gym', 'fitness'],
    shortDescription: 'Space-saving adjustable dumbbells 2-24kg.',
    description: 'Replace 12 pairs of dumbbells with one set. Quick-adjust weight from 2kg to 24kg per hand. Compact design perfect for home gyms. Durable steel construction with secure locking mechanism.',
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'],
  },
  {
    title: 'Resistance Bands Set',
    brand: 'Fit Simplify',
    category: 'Sports & Fitness',
    price: 899,
    stock: 150,
    tags: ['resistance-bands', 'home-workout', 'fitness'],
    shortDescription: 'Set of 5 resistance bands with handles and door anchor.',
    description: 'Professional-grade latex resistance bands in 5 resistance levels. Includes handles, door anchor, ankle straps, and carry bag. Perfect for strength training at home or while traveling.',
    images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600'],
  },
  {
    title: 'Garmin Forerunner 265',
    brand: 'Garmin',
    category: 'Sports & Fitness',
    price: 43900,
    stock: 14,
    tags: ['smartwatch', 'running', 'gps', 'sports'],
    shortDescription: 'Running smartwatch with AMOLED touchscreen display.',
    description: 'Garmin Forerunner 265 features training readiness metrics, morning report, and heart rate monitor. Colorful AMOLED display offers stats at a glance with up to 13 days of battery life.',
    images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600'],
  },
  {
    title: 'Hydro Flask 32oz Bottle',
    brand: 'Hydro Flask',
    category: 'Sports & Fitness',
    price: 3499,
    stock: 75,
    tags: ['water-bottle', 'bottle', 'outdoor'],
    shortDescription: 'Vacuum insulated stainless steel water bottle.',
    description: 'TempShield double-wall vacuum insulation keeps cold drinks icy cold for 24 hours, and hot drinks piping hot for 12. Durable Pro-Grade stainless steel structure ensures pure taste.',
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'],
  },
  {
    title: 'TRX Go Suspension Trainer',
    brand: 'TRX',
    category: 'Sports & Fitness',
    price: 11999,
    compareAtPrice: 13999,
    stock: 30,
    tags: ['workout', 'gym', 'portable'],
    shortDescription: 'Full-body suspension weight training system.',
    description: 'TRX GO is the lightest, most portable suspension trainer. Perfect for travel or workouts at home. Anchor to a door, tree, or structural beam for total body workouts.',
    images: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600'],
  },
  {
    title: 'Coleman Sundome 4-Person Tent',
    brand: 'Coleman',
    category: 'Sports & Fitness',
    price: 7999,
    stock: 18,
    tags: ['tent', 'camping', 'outdoor'],
    shortDescription: 'Dome camping tent with WeatherTec protection.',
    description: 'Sundome 4-person tent features large windows, a ground vent, and WeatherTec system corners. Extremely easy setup in under 10 minutes, making it ideal for weekend camping trips.',
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'],
  },

  // --- BOOKS ---
  {
    title: 'Atomic Habits by James Clear',
    brand: 'Penguin',
    category: 'Books',
    price: 499,
    stock: 200,
    isFeatured: true,
    tags: ['self-help', 'productivity', 'bestseller'],
    shortDescription: 'Tiny changes, remarkable results — #1 NYT bestseller.',
    description: 'James Clear reveals practical strategies for forming good habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results. Over 15 million copies sold worldwide.',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'],
  },
  {
    title: 'The Psychology of Money',
    brand: 'Harriman House',
    category: 'Books',
    price: 399,
    stock: 150,
    tags: ['finance', 'investing', 'psychology'],
    shortDescription: 'Timeless lessons on wealth, greed, and happiness.',
    description: 'Morgan Housel shares 19 short stories exploring the strange ways people think about money. A must-read for understanding behavioral finance and building lasting wealth.',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'],
  },
  {
    title: 'Sapiens by Yuval Noah Harari',
    brand: 'Harper',
    category: 'Books',
    price: 599,
    compareAtPrice: 699,
    stock: 180,
    tags: ['history', 'anthropology', 'bestseller'],
    shortDescription: 'A brief history of humankind.',
    description: 'Sapiens spans the whole of human history, from the very first humans to walk the earth to the radical breakthroughs of our cognitive, agricultural, and scientific revolutions.',
    images: ['https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=600'],
  },
  {
    title: 'Thinking, Fast and Slow',
    brand: 'FSG',
    category: 'Books',
    price: 549,
    stock: 95,
    tags: ['psychology', 'rationality', 'economics'],
    shortDescription: 'Fascinating breakdown of the mind’s two systems.',
    description: 'Daniel Kahneman explains the two systems that drive the way we think: System 1 (fast, intuitive, emotional) and System 2 (slow, deliberative, logical). Highly influential psychology book.',
    images: ['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600'],
  },
  {
    title: 'Deep Work by Cal Newport',
    brand: 'Grand Central',
    category: 'Books',
    price: 450,
    stock: 120,
    tags: ['productivity', 'work', 'focus'],
    shortDescription: 'Rules for focused success in a distracted world.',
    description: 'Cal Newport introduces the power of deep work: the ability to focus without distraction on cognitively demanding tasks. A guides-oriented productivity blueprint for professionals.',
    images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600'],
  },
  {
    title: 'Zero to One by Peter Thiel',
    brand: 'Crown',
    category: 'Books',
    price: 399,
    stock: 130,
    tags: ['startup', 'business', 'tech'],
    shortDescription: 'Notes on startups, or how to build the future.',
    description: 'Peter Thiel shows how we can find singular ways to create new things. The next Bill Gates will not build an operating system. Zero to One is about how to build a monopoly company.',
    images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600'],
  },

  // --- BEAUTY ---
  {
    title: 'CeraVe Moisturizing Cream',
    brand: 'CeraVe',
    category: 'Beauty',
    price: 1499,
    stock: 90,
    tags: ['skincare', 'moisturizer', 'dermatologist'],
    shortDescription: 'Dermatologist-recommended moisturizer with ceramides.',
    description: 'Developed with dermatologists, CeraVe Moisturizing Cream contains 3 essential ceramides and hyaluronic acid. Fragrance-free, non-comedogenic, and suitable for face and body.',
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'],
  },
  {
    title: 'Maybelline Fit Me Foundation',
    brand: 'Maybelline',
    category: 'Beauty',
    price: 599,
    stock: 75,
    tags: ['makeup', 'foundation', 'beauty'],
    shortDescription: 'Natural matte foundation for all skin types.',
    description: 'Fit Me Matte + Poreless Foundation adapts to skin tone and texture. Oil-free formula with SPF 18. Available in 40 shades for a natural, flawless finish.',
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600'],
  },
  {
    title: 'The Ordinary Niacinamide 10%',
    brand: 'The Ordinary',
    category: 'Beauty',
    price: 899,
    compareAtPrice: 1100,
    stock: 110,
    tags: ['skincare', 'serum', 'acne'],
    shortDescription: 'High-strength vitamin and mineral blemish formula.',
    description: 'This serum targets breakouts, minimizes pores, and regulates sebum activity. Lightweight water-based formula containing niacinamide (Vitamin B3) and zinc PCA.',
    images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600'],
  },
  {
    title: 'Laneige Lip Sleeping Mask',
    brand: 'Laneige',
    category: 'Beauty',
    price: 1620,
    stock: 65,
    tags: ['lipbalm', 'overnight', 'skincare'],
    shortDescription: 'Berry-scented leave-on lip sleeping mask.',
    description: 'Laneige Lip Sleeping Mask gently melts away dead skin cells from the lips overnight. Enriched with vitamin C, antioxidants, and Moisture Wrap technology for soft lips.',
    images: ['https://images.unsplash.com/photo-1617897903246-719242758050?w=600'],
  },
];

// Generates an additional 30+ products procedurally to reach 60+ products total
function expandProductsList() {
  const extraProducts = [
    // Electronics
    { title: 'Apple Watch Series 9', brand: 'Apple', category: 'Electronics', price: 41900, stock: 30, tags: ['smartwatch', 'apple', 'fitness'], shortDescription: 'Advanced health metrics with always-on retina display.', description: 'Apple Watch Series 9 helps you stay connected, active, healthy, and safe. Double tap gesture support, brighter screen, and on-device Siri.' },
    { title: 'Sony Alpha 7 IV Camera', brand: 'Sony', category: 'Electronics', price: 219900, stock: 6, tags: ['camera', 'dslr', 'photography'], shortDescription: 'Full-frame mirrorless hybrid camera 33MP.', description: 'The Alpha 7 IV sets standard for full-frame mirrorless cameras. Outstanding 33MP image quality, 4K 60p video, and real-time autofocus tracking.' },
    { title: 'Anker Power Bank 20K', brand: 'Anker', category: 'Electronics', price: 3499, stock: 120, tags: ['charger', 'accessories', 'powerbank'], shortDescription: 'Ultra-high capacity power bank 20,000mAh.', description: 'Anker PowerCore 20K delivers rapid charging to smartphones, tablets, and devices. PowerIQ technology ensures safe and efficient power delivery.' },
    
    // Fashion
    { title: 'Levis 511 Slim Jeans', brand: 'Levis', category: 'Fashion', price: 3999, stock: 85, tags: ['jeans', 'levis', 'denim'], shortDescription: 'Modern slim fit jeans with room to move.', description: 'The Levis 511 Slim Fit Jeans are a modern classic. Cut close but not too tight, they offer stretch denim construction for all-day comfort.' },
    { title: 'Timberland Premium Boots', brand: 'Timberland', category: 'Fashion', price: 16999, stock: 15, tags: ['boots', 'shoes', 'leather'], shortDescription: 'Waterproof 6-inch nubuck leather boots.', description: 'The original Timberland waterproof boot. Crafted in premium full-grain nubuck leather, padded collar, and rubber lug outsole for grip.' },
    { title: 'Patagonia Rain Jacket', brand: 'Patagonia', category: 'Fashion', price: 14500, stock: 22, tags: ['jacket', 'patagonia', 'outdoor'], shortDescription: 'Waterproof and breathable Torrentshell jacket.', description: 'Patagonia Torrentshell 3L uses 3-layer H2No Performance Standard technology for exceptional waterproof durability and all-day comfort.' },
    
    // Home & Kitchen
    { title: 'Philips Air Purifier', brand: 'Philips', category: 'Home & Kitchen', price: 9999, stock: 32, tags: ['air-purifier', 'smart-home', 'kitchen'], shortDescription: 'HEPA air purifier for allergies and dust.', description: 'Philips Series 1000i purifies air in under 10 minutes. Captures 99.97% of pollen, dust, viruses, and pet dander. App-controlled interface.' },
    { title: 'Casper Sleep Pillow', brand: 'Casper', category: 'Home & Kitchen', price: 5500, stock: 90, tags: ['pillow', 'bedding', 'comfort'], shortDescription: 'Casper original pillow with pillow-in-pillow design.', description: ' Caspers unique double-pillow design supports neck alignment. Filled with responsive microfiber, it remains fluffy and cool all night.' },
    { title: 'Ring Video Doorbell Plus', brand: 'Ring', category: 'Home & Kitchen', price: 14999, stock: 28, tags: ['doorbell', 'smart-home', 'security'], shortDescription: 'Battery-powered smart video doorbell with 1536p HD video.', description: 'Ring Video Doorbell Plus offers Head-to-Toe HD+ Video, Live View, and real-time motion alerts. Easy DIY installation with rechargeable battery.' },
    
    // Sports & Fitness
    { title: 'Fitbit Charge 6 Tracker', brand: 'Fitbit', category: 'Sports & Fitness', price: 14999, stock: 55, tags: ['fitness', 'tracker', 'smartwatch'], shortDescription: 'Advanced fitness and health tracker with GPS.', description: ' Fitbit Charge 6 monitors heart rate, SpO2, sleep quality, and daily readiness. Built-in GPS tracks outdoor runs, plus 7 days battery.' },
    { title: 'Bowflex Kettlebell Set', brand: 'Bowflex', category: 'Sports & Fitness', price: 18999, stock: 12, tags: ['gym', 'fitness', 'kettlebell'], shortDescription: 'Adjustable selecttech kettlebell 3.5-18kg.', description: 'Replace 6 kettlebells with one space-saving design. Adjust weight from 3.5kg to 18kg with a simple turn of the dial. Ergonomic handle.' },
    { title: 'Coleman Cooler Box 50QT', brand: 'Coleman', category: 'Sports & Fitness', price: 5999, stock: 25, tags: ['cooler', 'outdoor', 'camping'], shortDescription: '50-quart wheeled cooler box keeps ice for 5 days.', description: 'Heavy-duty Coleman cooler box holds up to 84 cans. Heavy-duty wheels and telescopic handle make it easy to transport on camping trips.' },
    
    // Books
    { title: 'Sapiens Graphic Novel', brand: 'Harper', category: 'Books', price: 999, stock: 60, tags: ['history', 'graphic-novel', 'sapiens'], shortDescription: 'Yuval Noah Harari’s masterpiece in graphic format.', description: 'The graphic novel adaptation of Sapiens: A Brief History of Humankind. A radical, beautiful, and witty retelling of human evolution.' },
    { title: 'Deep Work Workbook', brand: 'Grand Central', category: 'Books', price: 299, stock: 110, tags: ['notebook', 'productivity', 'study'], shortDescription: 'Companion notebook and task planner for Deep Work.', description: 'Structured templates and daily scheduling spreadsheets designed to help you execute Cal Newports deep focus principles systematically.' },
    { title: 'Dune by Frank Herbert', brand: 'Ace Books', category: 'Books', price: 499, stock: 140, tags: ['fiction', 'sci-fi', 'novel'], shortDescription: 'Classic science fiction masterpiece novel.', description: 'Set on the desert planet Arrakis, Dune is the story of Paul Atreides, who leads a rebellion to secure control of the universe’s most valuable spice.' },

    // Beauty
    { title: 'Dyson Airwrap Multi-Styler', brand: 'Dyson', category: 'Beauty', price: 49900, stock: 8, tags: ['hairstyler', 'dyson', 'haircare'], shortDescription: 'Coanda air styling tool without extreme heat.', description: 'Dyson Airwrap curls, shapes, smooths, and hides flyaways using Coanda airflow technology. Engineered for multiple hair types.' },
    { title: 'Neutrogena Hydro Boost Gel', brand: 'Neutrogena', category: 'Beauty', price: 1150, stock: 100, tags: ['moisturizer', 'skincare', 'gel'], shortDescription: 'Hyaluronic acid water gel moisturizer.', description: 'Neutrogena Hydro Boost water gel instantly quenches dry skin and keeps it looking smooth, supple, and hydrated day after day.' },
    { title: 'Olaplex No. 3 Perfector', brand: 'Olaplex', category: 'Beauty', price: 2950, stock: 48, tags: ['haircare', 'treatment', 'beauty'], shortDescription: 'At-home hair bond repairing treatment.', description: 'Olaplex No. 3 Hair Perfector reduces breakage and visibly strengthens hair, improving its look and feel by repairing damaged bonds.' }
  ];

  // Map to duplicate with slight variants to reach 60+ products
  const duplicated: any[] = [];
  extraProducts.forEach((item, idx) => {
    // Original
    duplicated.push(item);
    // Variant 1
    duplicated.push({
      ...item,
      title: item.title + ' (Premium Pack)',
      price: Math.round(item.price * 1.25),
      stock: Math.max(2, item.stock - 5),
      isFeatured: idx % 4 === 0
    });
  });

  return [...products, ...duplicated];
}

const finalProducts = expandProductsList();

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    const adminPassword = await hashPassword('Admin@123');
    const customerPassword = await hashPassword('Customer@123');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@commerceai.com',
      password: adminPassword,
      role: 'admin',
    });

    const customer = await User.create({
      name: 'Demo Customer',
      email: 'customer@commerceai.com',
      password: customerPassword,
      role: 'customer',
    });

    await Cart.create([
      { user: admin._id, items: [] },
      { user: customer._id, items: [] },
    ]);
    await Wishlist.create([
      { user: admin._id, products: [] },
      { user: customer._id, products: [] },
    ]);

    console.log('Created users');

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    for (const cat of categories) {
      const created = await Category.create({ ...cat, slug: slugify(cat.name) });
      categoryMap.set(cat.name, created._id);
    }
    console.log(`Created ${categories.length} categories`);

    for (const prod of finalProducts) {
      const categoryId = categoryMap.get(prod.category);
      if (!categoryId) continue;

      const textToEmbed = `${prod.title} ${prod.shortDescription || ''} ${prod.description || ''}`;
      const embedding = await getEmbedding(textToEmbed);

      await Product.create({
        title: prod.title,
        slug: slugify(prod.title),
        description: prod.description,
        shortDescription: prod.shortDescription,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice ?? undefined,
        category: categoryId,
        images: prod.images ?? ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        tags: prod.tags,
        brand: prod.brand,
        stock: prod.stock,
        isFeatured: prod.isFeatured ?? false,
        rating: +(3.8 + Math.random() * 1.2).toFixed(1),
        reviewCount: Math.floor(Math.random() * 180) + 12,
        embedding: embedding,
      });
    }
    console.log(`Created ${finalProducts.length} products total in database!`);

    console.log('\nSeed completed successfully!');
    console.log('Admin:    admin@commerceai.com / Admin@123');
    console.log('Customer: customer@commerceai.com / Customer@123');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
