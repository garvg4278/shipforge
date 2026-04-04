// lib/api.ts — Centralised API client. All backend calls go through here.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  errors?: { field: string; message: string }[];
  constructor(message: string, status: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('shipforge_token');
};

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.message || 'Request failed', res.status, json.errors);
  }
  return json.data as T;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/signup', {
      method: 'POST', body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify(body),
    }),
};

// ── User ──────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => request<User>('/user/profile'),
};

// ── Shipments ─────────────────────────────────────────────────────────────────
export const shipmentApi = {
  create: (body: CreateShipmentPayload) =>
    request<Shipment>('/shipments', { method: 'POST', body: JSON.stringify(body) }),
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Shipment>>(`/shipments${qs}`);
  },
  getById: (id: string) => request<Shipment>(`/shipments/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getAllShipments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Shipment>>(`/admin/shipments${qs}`);
  },
  updateStatus: (id: string, status: string) =>
    request<Shipment>(`/admin/shipments/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
  deleteShipment: (id: string) =>
    request<{ orderId: string }>(`/admin/shipments/${id}`, { method: 'DELETE' }),
  createAdmin: (body: { name: string; email: string; password: string }) =>
    request<User>('/admin/create-admin', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AddressEntry {
  id: string;
  type: 'SENDER' | 'RECEIVER';
  name: string;
  address: string;
  city: string;
  pincode: string;
}

export interface PackageEntry {
  id: string;
  name: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  declaredValue: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  userId: string;
  shipmentDate: string;
  deliveryType: 'STANDARD' | 'EXPRESS';
  fragile: boolean;
  insured: boolean;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  addresses: AddressEntry[];
  packages: PackageEntry[];
  sender?: AddressEntry;
  receiver?: AddressEntry;
  user?: { id: string; name: string; email: string };
  totalPackages: number;
  totalWeight: number;
  totalDeclaredValue: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number; page: number; limit: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

export interface CreateShipmentPayload {
  shipmentDate: string;
  deliveryType: 'STANDARD' | 'EXPRESS';
  fragile: boolean;
  insured: boolean;
  sender: { name: string; address: string; city: string; pincode: string };
  receiver: { name: string; address: string; city: string; pincode: string };
  packages: {
    name: string; weight: string; length: string;
    width: string; height: string; declaredValue: string;
  }[];
}
