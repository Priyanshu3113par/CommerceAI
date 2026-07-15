import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Heart, Shield, RotateCcw, Truck, Star } from 'lucide-react';
import { useState } from 'react';
import { productApi, cartApi, wishlistApi } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [wishlistSuccess, setWishlistSuccess] = useState(false);

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getBySlug(slug as string),
    enabled: !!slug,
  });

  const product = productData?.data.data;

  const { data: recommendedData } = useQuery({
    queryKey: ['recommendedProducts', product?.category],
    queryFn: () =>
      productApi.getAll({
        category: typeof product?.category === 'object' ? (product.category as any).slug : undefined,
        limit: 4,
      }),
    enabled: !!product?.category,
  });

  const addToCartMutation = useMutation({
    mutationFn: () => cartApi.add(product?._id as string, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.add(product?._id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      setWishlistSuccess(true);
      setTimeout(() => setWishlistSuccess(false), 3000);
    },
  });

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;
  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <p className="mt-2 text-gray-500">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="btn-primary mt-6 inline-block py-2">
          Back to Shop
        </Link>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' ? (product.category as any).name : 'Product';
  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const recommendations = (recommendedData?.data.data || []).filter((p) => p._id !== product._id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/home" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-brand-600">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm aspect-square">
            <img
              src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
              alt={product.title}
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            {product.brand && <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">{product.brand}</span>}
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{product.title}</h1>
            <div className="mt-2 flex items-center gap-4">
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {product.rating}
              </span>
              <span className="text-xs text-gray-500">({product.reviewCount} customer reviews)</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Category: {categoryName}
              </span>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="my-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                    -{discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {product.stock > 0 ? `In Stock (${product.stock} units remaining)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <p className="text-base text-gray-600 leading-relaxed mb-6">
            {product.shortDescription || product.description.substring(0, 200) + '...'}
          </p>

          {product.stock > 0 && (
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-semibold text-gray-700">Qty:</label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold shadow-sm focus:border-brand-600 focus:outline-none"
                >
                  {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending}
                  className={`btn-primary flex flex-1 items-center justify-center gap-2 py-3.5 text-sm shadow-md transition duration-300 ${
                    cartSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartSuccess ? 'Added to Cart!' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => addToWishlistMutation.mutate()}
                  disabled={addToWishlistMutation.isPending}
                  className={`btn-secondary flex items-center justify-center gap-2 px-6 py-3.5 text-sm transition duration-300 ${
                    wishlistSuccess ? 'text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100' : ''
                  }`}
                >
                  <Heart className={`h-5 w-5 ${wishlistSuccess ? 'fill-rose-600' : ''}`} />
                  {wishlistSuccess ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-600">
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-5 w-5 text-brand-600" />
              <span className="font-semibold text-gray-900">Fast Shipping</span>
              <span>Delivery in 2-4 days</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-5 w-5 text-brand-600" />
              <span className="font-semibold text-gray-900">7 Days Return</span>
              <span>Hassle-free return policy</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield className="h-5 w-5 text-brand-600" />
              <span className="font-semibold text-gray-900">Secured Checkout</span>
              <span>SSL encrypted billing</span>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-gray-100 pt-12">
        <h2 className="text-2xl font-bold text-gray-900">Product Description</h2>
        <div className="mt-4 text-base text-gray-600 leading-relaxed whitespace-pre-line">
          {product.description}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-12">
          <h2 className="text-2xl font-bold text-gray-900">AI Recommended Products</h2>
          <p className="text-xs text-gray-500 mb-6 mt-0.5">Based on similarity and shopping behavior</p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.slice(0, 4).map((rec) => (
              <div key={rec._id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img
                    src={rec.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                    alt={rec.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 line-clamp-1">
                    <Link to={`/products/${rec.slug}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {rec.title}
                    </Link>
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-xxs font-bold text-amber-800">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      {rec.rating}
                    </span>
                    <span className="text-xxs text-gray-400">({rec.reviewCount})</span>
                  </div>
                  <div className="mt-auto pt-3">
                    <span className="text-sm font-bold text-gray-900">₹{rec.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
