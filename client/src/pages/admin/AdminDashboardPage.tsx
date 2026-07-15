import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Users, AlertTriangle, Package, BarChart2, CheckCircle } from 'lucide-react';
import { adminApi } from '../../services';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboardPage() {
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['adminSales'],
    queryFn: () => adminApi.getSalesReports(),
  });

  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ['adminInventory'],
    queryFn: () => adminApi.getInventoryReports(),
  });

  const stats = statsData?.data.data;
  const sales = salesData?.data.data;
  const inventory = inventoryData?.data.data;

  if (loadingStats || loadingSales || loadingInventory) {
    return <LoadingSpinner className="py-20" size="lg" />;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Total Orders',
      value: stats?.ordersCount,
      icon: ShoppingCart,
      color: 'bg-brand-600 text-white',
      bgColor: 'bg-brand-50',
    },
    {
      title: 'Active Customers',
      value: stats?.customerCount,
      icon: Users,
      color: 'bg-indigo-600 text-white',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount,
      icon: AlertTriangle,
      color: stats?.lowStockCount && stats.lowStockCount > 0 ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white',
      bgColor: stats?.lowStockCount && stats.lowStockCount > 0 ? 'bg-amber-50' : 'bg-gray-50',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time store metrics and aggregated sales metrics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm flex items-center gap-5">
              <div className={`rounded-xl p-3.5 ${card.bgColor}`}>
                <Icon className={`h-6 w-6 text-gray-800`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts / Data lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Revenue Shares */}
        <div className="lg:col-span-2 rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
            <BarChart2 className="h-5 w-5 text-brand-600" />
            <span>Sales by Category</span>
          </h2>
          <div className="mt-6 space-y-4">
            {sales?.salesByCategory.map((cat: any, idx: number) => {
              const maxRev = sales.salesByCategory[0]?.revenue || 1;
              const percent = Math.round((cat.revenue / maxRev) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>{cat._id}</span>
                    <span>₹{cat.revenue.toLocaleString('en-IN')} ({cat.salesCount} sold)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!sales?.salesByCategory || sales.salesByCategory.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-10">No sales recorded yet.</p>
            )}
          </div>
        </div>

        {/* Inventory Report Card */}
        <div className="lg:col-span-1 rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Package className="h-5 w-5 text-brand-600" />
            <span>Inventory Status</span>
          </h2>
          <div className="mt-6 space-y-4 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>Total Catalog Products</span>
              <span className="font-bold text-gray-900">{inventory?.totalProducts}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>Total In-Stock Items</span>
              <span className="font-bold text-gray-900">{inventory?.totalStock}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>Average Catalog Price</span>
              <span className="font-bold text-gray-900">₹{inventory?.avgPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Asset Valuation</span>
              <span className="font-bold text-emerald-600">₹{inventory?.totalValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low stock alerts panel */}
      <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>Low Inventory Warnings</span>
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xxs font-semibold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Remaining</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory?.lowStockItems.map((item: any) => (
                <tr key={item._id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{item.title}</td>
                  <td className="py-3.5 px-4">{(item.category as any)?.name || 'General'}</td>
                  <td className="py-3.5 px-4">₹{item.price.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{item.stock} units</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xxs font-bold text-amber-800 border border-amber-200">
                      Critically Low
                    </span>
                  </td>
                </tr>
              ))}
              {(!inventory?.lowStockItems || inventory.lowStockItems.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 font-semibold">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <span>All stock levels are optimal!</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
