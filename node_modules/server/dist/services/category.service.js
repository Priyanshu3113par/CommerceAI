import { Category } from '../models/Category.js';
import { slugify } from '../utils/helpers.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { getFallbackCategories, isFallbackMode } from '../config/fallbackStore.js';
export class CategoryService {
    async findAll() {
        if (isFallbackMode()) {
            return getFallbackCategories();
        }
        return Category.find({ isActive: true }).sort({ name: 1 }).lean();
    }
    async findBySlug(slug) {
        const category = await Category.findOne({ slug, isActive: true }).lean();
        if (!category)
            throw new NotFoundError('Category not found');
        return category;
    }
    async create(data) {
        const slug = slugify(data.name);
        const existing = await Category.findOne({ slug });
        if (existing)
            throw new ConflictError('Category already exists');
        return Category.create({ ...data, slug });
    }
    async update(id, data) {
        if (data.name)
            data.slug = slugify(data.name);
        const category = await Category.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
        if (!category)
            throw new NotFoundError('Category not found');
        return category;
    }
    async delete(id) {
        const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!category)
            throw new NotFoundError('Category not found');
        return category;
    }
}
export const categoryService = new CategoryService();
