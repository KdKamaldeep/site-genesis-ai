import axios, { AxiosInstance } from 'axios';
import type {
  User,
  Tenant,
  Keyword,
  Content,
  AuthResponse,
  BulkCreateResponse,
  GenerateContentResponse,
  PaginationResponse,
} from './types';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token from localStorage if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),
  register: (email: string, password: string, role: 'admin' | 'manager' = 'admin') =>
    apiClient.post<{ user: User }>('/auth/register', { email, password, role }),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get<{ user: User }>('/auth/me'),
};

// Tenant API
export const tenantAPI = {
  getAll: () => apiClient.get<Tenant[]>('/tenants'),
  getById: (id: string) => apiClient.get<Tenant>(`/tenants/${id}`),
  create: (data: Partial<Tenant>) => apiClient.post<Tenant>('/tenants', data),
  update: (id: string, data: Partial<Tenant>) => apiClient.put<Tenant>(`/tenants/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tenants/${id}`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('tenantFile', file);
    return apiClient.post<{ message: string; tenant: Tenant; importResults: any }>('/tenants/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Keyword API
export const keywordAPI = {
  getAll: (params?: {
    tenantId?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<PaginationResponse<Keyword> | Keyword[]>('/keywords', { params }),
  getById: (id: string) => apiClient.get<Keyword>(`/keywords/${id}`),
  create: (data: { tenantId: string; keyword: string; type: 'essay' | 'speech' | 'tenLines' | 'pageContent'; slug?: string; customPrompt?: string }) =>
    apiClient.post<Keyword>('/keywords', data),
  bulkCreate: (data: { tenantId: string; keywords: string[]; type: 'essay' | 'speech' | 'tenLines' | 'pageContent' }) =>
    apiClient.post<BulkCreateResponse>('/keywords/bulk', data),
  update: (id: string, data: Partial<Keyword>) => apiClient.put<Keyword>(`/keywords/${id}`, data),
  delete: (id: string) => apiClient.delete(`/keywords/${id}`),
  retry: (id: string) => apiClient.post<{ message: string; keyword: Keyword }>(`/keywords/${id}/retry`),
};

// Content API
export const contentAPI = {
  getAll: (params?: {
    tenantId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<PaginationResponse<Content> | Content[]>('/content', { params }),
  getById: (id: string) => apiClient.get<Content>(`/content/${id}`),
  generate: (tenantId: string, count: number = 5) =>
    apiClient.post<GenerateContentResponse>(`/content/generate/${tenantId}`, { count }),
  update: (id: string, data: Partial<Content>) => apiClient.put<Content>(`/content/${id}`, data),
  regenerate: (id: string) => apiClient.post<Content>(`/content/${id}/regenerate`),
  delete: (id: string) => apiClient.delete(`/content/${id}`),
};

// Template API
export const templateAPI = {
  get: (tenantId: string) =>
    apiClient.get<{ tenantId: string; template: string; isDefault?: boolean }>(`/template/${tenantId}`),
  update: (tenantId: string, template: string) =>
    apiClient.put<{ message: string; tenantId: string }>(`/template/${tenantId}`, { template }),
  preview: (tenantId: string, template: string) =>
    apiClient.post<{ html: string }>(`/template/${tenantId}/preview`, { template }),
};

// Cron API
export const cronAPI = {
  run: (tenantId: string) => apiClient.post(`/cron/run/${tenantId}`),
  updateFrequency: (tenantId: string, frequency: number) =>
    apiClient.put<Tenant>(`/cron/update/${tenantId}`, { cronFrequency: frequency }),
};

// AI Provider API
export interface AIProviderConfig {
  openai: {
    enabled: boolean;
    hasApiKey: boolean;
  };
  gemini: {
    enabled: boolean;
    hasApiKey: boolean;
  };
}

export const aiProviderAPI = {
  get: () => apiClient.get<AIProviderConfig>('/ai-providers'),
  update: (config: AIProviderConfig) => apiClient.put<AIProviderConfig>('/ai-providers', config),
};

export default apiClient;

