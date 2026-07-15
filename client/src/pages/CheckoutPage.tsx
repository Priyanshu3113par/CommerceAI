import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { CreditCard, ShoppingBag, Truck } from 'lucide-react';
import { cartApi, orderApi } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import type { ShippingAddress } from '../types';

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingAddress>({
    defaultValues: { country: 'India' }
  });

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  });

  const cart = cartData?.data.data;
  const items = cart?.items || [];

  const placeOrderMutation = useMutation({
    mutationFn: (shippingAddress: ShippingAddress) => orderApi.place(shippingAddress),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders', { state: { success: true, orderNumber: response.data.data?.orderNumber } });
    },
  });

  const onSubmit = (data: ShippingAddress) => {
    placeOrderMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Add products to your cart before proceeding to checkout.</p>
        <Link to="/products" className="btn-primary mt-8 inline-block px-8 py-3">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Shipping Address */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Truck className="h-5 w-5 text-brand-600" />
                <span>Shipping Address</span>
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Full Name</label>
                  <input
                    type="text"
                    {...register('fullName', { required: 'Full name is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    {...register('phone', { required: 'Phone number is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Street Address</label>
                  <input
                    type="text"
                    {...register('street', { required: 'Street address is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">City</label>
                  <input
                    type="text"
                    {...register('city', { required: 'City is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">State</label>
                  <input
                    type="text"
                    {...register('state', { required: 'State is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">PIN / Zip Code</label>
                  <input
                    type="text"
                    {...register('zipCode', { required: 'PIN code is required' })}
                    className="input-field mt-1.5 text-sm"
                  />
                  {errors.zipCode && <p className="mt-1 text-xs text-red-600">{errors.zipCode.message}</p>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Country</label>
                  <input
                    type="text"
                    {...register('country', { required: 'Country is required' })}
                    className="input-field mt-1.5 text-sm bg-gray-50 border-gray-200 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
                <CreditCard className="h-5 w-5 text-brand-600" />
                <span>Payment Method</span>
              </h2>
              <div className="mt-4 p-4 border border-brand-100 bg-brand-50/50 rounded-xl flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-600 bg-brand-600 text-white text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Demo Instant Payment</p>
                  <p className="text-xs text-gray-500">Order will be placed in paid state automatically for evaluation.</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={placeOrderMutation.isPending}
                className="btn-primary w-full py-4 text-sm font-bold shadow-md transition duration-300"
              >
                {placeOrderMutation.isPending ? 'Processing Order...' : `Pay & Place Order (₹${cart?.total.toLocaleString('en-IN')})`}
              </button>
              {placeOrderMutation.isError && (
                <p className="mt-2 text-center text-sm font-semibold text-rose-600">
                  Checkout failed: {placeOrderMutation.error.message || 'Please verify stock and try again.'}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Order Breakdown sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-600" />
              <span>Items Summary</span>
            </h2>

            {/* Mini items list */}
            <div className="mt-4 divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
              {items.map((item: any) => (
                <div key={item.product._id} className="flex py-3 gap-3">
                  <img
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.product.title}
                    className="h-12 w-12 rounded object-cover border border-gray-150 shrink-0 aspect-square"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 truncate">{item.product.title}</h4>
                    <p className="text-xxs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900 shrink-0 ml-2">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-100 pt-4 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{cart?.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-gray-900">
                  {cart?.shipping === 0 ? <span className="text-emerald-600">Free</span> : `₹${cart?.shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST 18%)</span>
                <span className="font-semibold text-gray-900">₹{cart?.tax.toLocaleString('en-IN')}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-1">
                <span>Total Amount</span>
                <span>₹{cart?.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
