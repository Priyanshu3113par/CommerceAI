import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2, ShoppingCart, Star } from 'lucide-react';
import { wishlistApi, cartApi } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get(),
  });

  const products = wishlistData?.data.data || [];

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const moveToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await cartApi.add(productId, 1);
      await wishlistApi.remove(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Heart className="h-10 w-10 fill-rose-100" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your wishlist is empty</h2>
        <p className="mt-2 text-gray-500">Add products to your wishlist to keep track of items you love.</p>
        <Link to="/products" className="btn-primary mt-8 inline-block px-8 py-3 shadow-md">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
        <Heart className="h-8 w-8 text-rose-600 fill-rose-600" />
        <span>My Wishlist</span>
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const discountPercent = product.compareAtPrice
            ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
            : 0;

          return (
            <div key={product._id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-150 bg-white shadow-sm transition hover:shadow-md">
              {/* Product image */}
              <div className="aspect-square bg-gray-50 overflow-hidden relative">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                  alt={product.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <button
                  onClick={() => removeMutation.mutate(product._id)}
                  disabled={removeMutation.isPending}
                  className="absolute top-2 right-2 rounded-full p-2 bg-white/90 shadow hover:bg-white text-rose-600 border border-gray-100 transition"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col p-4">
                {product.brand && <span className="text-xxs font-semibold uppercase tracking-wider text-gray-400">{product.brand}</span>}
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 line-clamp-1 mt-0.5">
                  <Link to={`/products/${product.slug}`}>{product.title}</Link>
                </h3>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-xxs font-bold text-amber-800">
                    <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                    {product.rating}
                  </span>
                  <span className="text-xxs text-gray-400">({product.reviewCount})</span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.compareAtPrice && (
                    <span className="text-xs text-gray-400 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4">
                  {product.stock > 0 ? (
                    <button
                      onClick={() => moveToCartMutation.mutate(product._id)}
                      disabled={moveToCartMutation.isPending}
                      className="btn-secondary w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold shadow-sm"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Move to Cart</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="btn-secondary w-full py-2 text-xs font-semibold opacity-50 cursor-not-allowed text-gray-400 bg-gray-50 border-gray-200"
                    >
                      Out of Stock
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
