import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { cartApi } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CartPage() {
  const queryClient = useQueryClient();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  });

  const cart = cartData?.data.data;
  const items = cart?.items || [];

  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.update(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId: string) => cartApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ShoppingBag className="h-10 w-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn-primary mt-8 inline-block px-8 py-3 shadow-md">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Shopping Cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-150">
              {items.map((item: any) => (
                <div key={item.product._id} className="flex p-6 flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 aspect-square">
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt={item.product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-base font-bold text-gray-900">
                        <h3>
                          <Link to={`/products/${item.product.slug}`} className="hover:text-brand-600">
                            {item.product.title}
                          </Link>
                        </h3>
                        <p className="ml-4">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">₹{item.price.toLocaleString('en-IN')} each</p>
                    </div>

                    {/* Action panel */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                        <button
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                          onClick={() =>
                            updateQuantityMutation.mutate({
                              productId: item.product._id,
                              quantity: item.quantity - 1,
                            })
                          }
                          className="bg-gray-50 hover:bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button
                          disabled={item.quantity >= item.product.stock || updateQuantityMutation.isPending}
                          onClick={() =>
                            updateQuantityMutation.mutate({
                              productId: item.product._id,
                              quantity: item.quantity + 1,
                            })
                          }
                          className="bg-gray-50 hover:bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItemMutation.mutate(item.product._id)}
                        disabled={removeItemMutation.isPending}
                        className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
              className="text-sm font-semibold text-gray-500 hover:text-rose-600 transition"
            >
              Clear Entire Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Order Summary</h2>

            <div className="mt-4 space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{cart?.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping Estimate</span>
                <span className="font-semibold text-gray-900">
                  {cart?.shipping === 0 ? <span className="text-emerald-600">Free</span> : `₹${cart?.shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (GST 18%)</span>
                <span className="font-semibold text-gray-900">₹{cart?.tax.toLocaleString('en-IN')}</span>
              </div>

              {cart && cart.subtotal < 1000 && (
                <div className="rounded-lg bg-brand-50 p-3 text-xs text-brand-700 leading-normal">
                  Add <strong>₹{(1000 - cart.subtotal).toLocaleString('en-IN')}</strong> more to get <strong>Free Shipping</strong>!
                </div>
              )}

              <hr className="border-gray-200" />

              <div className="flex justify-between text-base font-extrabold text-gray-900">
                <span>Order Total</span>
                <span>₹{cart?.total.toLocaleString('en-IN')}</span>
              </div>

              <Link
                to="/checkout"
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm shadow-md transition duration-300"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
