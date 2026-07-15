import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { productApi, categoryApi } from '../../services';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Product } from '../../types';

interface ProductFormData {
  title: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  shortDescription: string;
  description: string;
  tagsString: string;
  imagesString: string;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>();

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => productApi.getAll({ limit: 100 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const products = productsData?.data.data || [];
  const categories = categoriesData?.data.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
    },
  });

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      title: '',
      brand: '',
      category: categories[0]?._id || '',
      price: 0,
      compareAtPrice: undefined,
      stock: 0,
      shortDescription: '',
      description: '',
      tagsString: '',
      imagesString: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    });
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      title: product.title,
      brand: product.brand || '',
      category: typeof product.category === 'object' ? (product.category as any)._id : product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      shortDescription: product.shortDescription || '',
      description: product.description,
      tagsString: product.tags.join(', '),
      imagesString: product.images.join(', '),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const onSubmit = (data: ProductFormData) => {
    const formattedData = {
      title: data.title,
      brand: data.brand,
      category: data.category,
      price: Number(data.price),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
      stock: Number(data.stock),
      shortDescription: data.shortDescription,
      description: data.description,
      tags: data.tagsString.split(',').map((t) => t.trim()).filter(Boolean),
      images: data.imagesString.split(',').map((img) => img.trim()).filter(Boolean),
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  if (loadingProducts) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage catalog details, pricing structures, and inventory levels.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2 py-3 px-5 text-sm shadow-md shrink-0 sm:self-end"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Catalog Table */}
      <div className="rounded-xl border border-gray-150 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xxs font-semibold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-6">Image</th>
                <th className="py-3 px-6">Product Details</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Price</th>
                <th className="py-3 px-6">Stock</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const categoryName = typeof product.category === 'object' ? (product.category as any).name : 'Unassigned';
                return (
                  <tr key={product._id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 shrink-0">
                      <img
                        src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={product.title}
                        className="h-12 w-12 rounded object-cover border border-gray-150 aspect-square"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 line-clamp-1">{product.title}</p>
                      {product.brand && <p className="text-xxs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{product.brand}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center rounded-full bg-gray-55 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span className={`font-mono font-bold text-xs ${product.stock <= 5 ? 'text-rose-600' : 'text-gray-900'}`}>
                        {product.stock} units
                      </span>
                      {product.stock <= 5 && <p className="text-xxs font-semibold text-rose-500 uppercase tracking-wide mt-0.5">Low Stock</p>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-brand-600 transition"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
                              deleteMutation.mutate(product._id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-extrabold text-gray-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Product Title</label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Brand Name</label>
                  <input
                    type="text"
                    {...register('brand', { required: 'Brand is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Category</label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="input-field mt-1.5 text-sm bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { required: 'Price is required', min: 0 })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Compare At Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('compareAtPrice')}
                    className="input-field mt-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Initial Stock (Units)</label>
                  <input
                    type="number"
                    {...register('stock', { required: 'Stock is required', min: 0 })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Image URLs (comma separated)</label>
                  <input
                    type="text"
                    {...register('imagesString', { required: 'At least one image URL is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.imagesString && <p className="mt-1 text-xs text-red-600">{errors.imagesString.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Tags (comma separated)</label>
                  <input
                    type="text"
                    {...register('tagsString')}
                    className="input-field mt-1.5 text-sm"
                    placeholder="e.g. laptop, gaming, electronics"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Short Summary Description</label>
                  <input
                    type="text"
                    {...register('shortDescription')}
                    className="input-field mt-1.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Detailed Description</label>
                  <textarea
                    rows={4}
                    {...register('description', { required: 'Description is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
                </div>
              </div>

              {/* Submit panel */}
              <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary py-2 px-5 text-xs font-semibold shadow-md"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
