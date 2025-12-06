// API Response Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager';
}

export interface Tenant {
  _id: string;
  name: string;
  domain: string;
  logoUrl: string;
  adsenseCode: string;
  theme: {
    primary: string;
    mode: 'light' | 'dark' | 'auto';
  };
  cronFrequency: number;
  createdAt: string;
}

export interface Keyword {
  _id: string;
  tenantId: string;
  keyword: string;
  type: 'essay' | 'speech' | 'tenLines' | 'pageContent';
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'failed_permanent';
  slug: string;
  retryCount?: number;
  error?: string;
  aiProvider?: 'openai' | 'gemini' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  _id: string;
  tenantId: string;
  type: 'essay' | 'speech' | 'tenLines' | 'pageContent';
  slug: string;
  title: string;
  sections: Record<string, any>;
  content: string;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  meta: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  html: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResponse<T> {
  [key: string]: T[] | {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface BulkCreateResponse {
  created: number;
  errors: number;
  errorDetails: Array<{
    keyword: string;
    error: string;
  }>;
}

export interface GenerateContentResponse {
  message: string;
  results: Array<{
    keyword: string;
    slug?: string;
    status: 'success' | 'failed' | 'failed_permanent';
    retryCount?: number;
    error?: string;
  }>;
  generated: number;
}

