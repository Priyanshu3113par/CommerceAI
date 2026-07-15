import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, MapPin, Calendar, CreditCard, ExternalLink } from 'lucide-react';
import { orderApi } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrderHistoryPage() {
  const location = useLocation();
  const state = location.state as { success?: boolean; orderNumber?: string } | null;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.getHistory(),
  });

  const orders = ordersData?.data.data || [];

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
    processing: 'bg-purple-50 text-purple-800 border-purple-200',
    shipped: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Success Banner */}
      {state?.success && (
        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 shadow-sm animate-pulse-subtle">
          <div className="flex gap-4">
            <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-950">Thank you for your order!</h3>
              <p className="mt-1 text-sm">
                Your order has been placed successfully. Order Number:{' '}
                <strong className="font-mono text-emerald-950">{state.orderNumber}</strong>.
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">A confirmation email has been sent with invoice details.</p>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
        <Package className="h-8 w-8 text-brand-600" />
        <span>Order History</span>
      </h1>

      {orders.length === 0 ? (
        <div className="mt-12 text-center py-20 bg-white border border-gray-100 rounded-xl shadow-sm">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No orders found</h3>
          <p className="mt-2 text-sm text-gray-500">You haven't placed any orders yet.</p>
          <Link to="/products" className="btn-primary mt-6 inline-block py-2">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={order._id} className="rounded-xl border border-gray-150 bg-white shadow-sm overflow-hidden">
                {/* Header info */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-150 gap-4">
                  <div className="grid grid-cols-2 md:flex gap-x-8 gap-y-2 text-xs">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider">Order Placed</p>
                      <p className="font-bold text-gray-800 flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{dateStr}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider">Order Total</p>
                      <p className="font-bold text-gray-900 mt-1">₹{order.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider">Order Number</p>
                      <p className="font-mono font-bold text-gray-800 mt-1">{order.orderNumber}</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                    statusColors[order.status] || 'bg-gray-100'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Items and address details */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Items */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</h4>
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex py-3 first:pt-0 last:pb-0 gap-4">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={item.title}
                            className="h-14 w-14 rounded object-cover border border-gray-200 shrink-0 aspect-square"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h5>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Quantity: {item.quantity} · Price: ₹{item.price.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gray-900 self-center">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery address & Payment */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4 text-xs text-gray-600">
                    <div>
                      <h4 className="font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>Delivery Address</span>
                      </h4>
                      <p className="font-bold text-gray-950">{order.shippingAddress.fullName}</p>
                      <p className="mt-1">{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                      <p>{order.shippingAddress.country}</p>
                      <p className="mt-1 text-gray-500 font-semibold">Phone: {order.shippingAddress.phone}</p>
                    </div>

                    <hr className="border-gray-200" />

                    <div>
                      <h4 className="font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span>Payment Status</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xxs font-bold uppercase border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <span className="text-xxs text-gray-400 font-semibold">Via Demo Gateways</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
