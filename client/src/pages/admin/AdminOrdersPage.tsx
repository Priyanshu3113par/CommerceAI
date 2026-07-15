import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Package, Eye } from 'lucide-react';
import { useState } from 'react';
import { orderApi } from '../../services';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Order } from '../../types';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['adminOrders', page],
    queryFn: () => orderApi.getAllAdmin(page, 15),
  });

  const orders = ordersData?.data.data || [];
  const meta = ordersData?.data.meta;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminSales'] });
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      if (viewingOrder) {
        // Update the current modal state too if open
        const updated = orders.find((o) => o._id === viewingOrder._id);
        if (updated) setViewingOrder(updated);
      }
    },
  });

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-800 border-yellow-250',
    confirmed: 'bg-blue-50 text-blue-800 border-blue-250',
    processing: 'bg-purple-50 text-purple-800 border-purple-250',
    shipped: 'bg-indigo-50 text-indigo-800 border-indigo-250',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-250',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review checkout history, monitor fulfillment pipeline, and modify delivery status.</p>
      </div>

      {/* Orders List Table */}
      <div className="rounded-xl border border-gray-150 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xxs font-semibold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-6">Order ID / Date</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Total Amount</th>
                <th className="py-3 px-6">Fulfillment Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr key={order._id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                      <p className="text-xxs text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{dateStr}</span>
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">{order.user?.name || 'Guest User'}</p>
                      <p className="text-xxs text-gray-400 truncate max-w-xs">{order.user?.email || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: order._id, status: e.target.value })}
                        disabled={updateStatusMutation.isPending}
                        className={`text-xs font-bold rounded-full px-2.5 py-1 border capitalize cursor-pointer focus:outline-none ${
                          statusColors[order.status] || 'bg-gray-55 text-gray-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="btn-secondary gap-1.5 py-1.5 px-3 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-semibold">
                    <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <span>No orders found in catalog.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {meta && meta.totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-100 py-3 px-6 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 font-semibold">
              Page {page} of {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Order Invoice Summary</h2>
                <p className="text-xxs text-gray-400 font-semibold font-mono mt-0.5">#{viewingOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              {/* Customer and shipping details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div>
                  <h4 className="font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</h4>
                  <p className="font-bold text-gray-900">{viewingOrder.user?.name || 'Guest User'}</p>
                  <p className="text-gray-500 mt-0.5 truncate max-w-xs">{viewingOrder.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-400 uppercase tracking-wider mb-1">Shipping To</h4>
                  <p className="font-bold text-gray-950">{viewingOrder.shippingAddress.fullName}</p>
                  <p className="mt-0.5 text-gray-600 leading-normal">{viewingOrder.shippingAddress.street}, {viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} - {viewingOrder.shippingAddress.zipCode}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Items</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex p-3 gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={item.title}
                        className="h-10 w-10 rounded object-cover border border-gray-200 shrink-0 aspect-square"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 truncate">{item.title}</h5>
                        <p className="text-xxs text-gray-400 mt-0.5">
                          {item.quantity} unit{item.quantity > 1 ? 's' : ''} at ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 self-center">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations summary */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{viewingOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{viewingOrder.shipping === 0 ? 'Free' : `₹${viewingOrder.shipping}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST 18%)</span>
                  <span>₹{viewingOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <hr className="border-gray-200 mt-1" />
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1">
                  <span>Order Total</span>
                  <span>₹{viewingOrder.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
