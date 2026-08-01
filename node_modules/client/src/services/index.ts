import { api } from './api';
import type {
  ApiResponse,
  LoginResponse,
  Product,
  Category,
  ProductFilters,
  User,
  Cart,
  Order,
  DashboardStats,
  SalesReports,
  InventoryReports,
} from '../types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  profile: () => api.get<ApiResponse<User>>('/auth/profile'),

  logout: () => api.post('/auth/logout'),
};

export const productApi = {
  getAll: (filters: ProductFilters = {}) =>
    api.get<ApiResponse<Product[]>>('/products', { params: filters }),

  getBySlug: (slug: string) => api.get<ApiResponse<Product>>(`/products/${slug}`),

  create: (data: any) => api.post<ApiResponse<Product>>('/products', data),

  update: (id: string, data: any) => api.put<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<any>>(`/products/${id}`),
};

export const categoryApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
};

export const cartApi = {
  get: () => api.get<ApiResponse<Cart>>('/cart'),

  add: (productId: string, quantity: number) =>
    api.post<ApiResponse<any>>('/cart', { productId, quantity }),

  update: (productId: string, quantity: number) =>
    api.put<ApiResponse<any>>(`/cart/${productId}`, { quantity }),

  remove: (productId: string) => api.delete<ApiResponse<any>>(`/cart/${productId}`),

  clear: () => api.delete<ApiResponse<any>>('/cart'),
};

export const wishlistApi = {
  get: () => api.get<ApiResponse<Product[]>>('/wishlist'),

  add: (productId: string) => api.post<ApiResponse<any>>('/wishlist', { productId }),

  remove: (productId: string) => api.delete<ApiResponse<any>>(`/wishlist/${productId}`),
};

export const orderApi = {
  place: (shippingAddress: any) => api.post<ApiResponse<Order>>('/orders', { shippingAddress }),

  getHistory: () => api.get<ApiResponse<Order[]>>('/orders'),

  getDetails: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  getAllAdmin: (page = 1, limit = 10) =>
    api.get<ApiResponse<Order[]>>('/orders/admin/all', { params: { page, limit } }),

  updateStatus: (id: string, status: string) =>
    api.put<ApiResponse<Order>>(`/orders/${id}/status`, { status }),
};

export const adminApi = {
  getDashboardStats: () => api.get<ApiResponse<DashboardStats>>('/admin/dashboard'),

  getSalesReports: () => api.get<ApiResponse<SalesReports>>('/admin/sales'),

  getInventoryReports: () => api.get<ApiResponse<InventoryReports>>('/admin/inventory'),
};

export const aiApi = {
  chat: (message: string) =>
    api.post<ApiResponse<{ message: string; products: Product[] }>>('/ai/chat', { message }),
};
