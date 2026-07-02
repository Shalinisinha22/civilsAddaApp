import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@config/env';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

const TOKEN_KEY = 'token';

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      await removeToken();
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const api = {
  banners: {
    getAll: (platform?: string) => {
      const query = platform ? `?platform=${platform}` : '';
      return apiRequest<Array<any>>(`/banners${query}`);
    },
  },
  series: {
    getAll: () => apiRequest<Array<any>>('/series'),
    getById: (id: string) => apiRequest<any>(`/series/${id}`),
  },
  auth: {
    register: (name: string, phoneNumber: string, password: string, email?: string) =>
      apiRequest<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, phoneNumber, password, ...(email && { email }) }),
      }),
    login: (phoneNumber: string, password: string) =>
      apiRequest<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, password }),
      }),
    me: () => apiRequest<{ user: any }>('/auth/me'),
    getGoogleAuthUrl: () => apiRequest<{ authUrl: string }>('/auth/google'),
    googleSignIn: (idToken: string) =>
      apiRequest<{ user: any; token: string }>('/auth/android/signin', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    updateProfile: (data: { name?: string; email?: string; phone?: string }) =>
      apiRequest<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  tests: {
    getAll: (params?: { category?: string; search?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      const query = queryParams.toString();
      return apiRequest<Array<any>>(`/tests${query ? `?${query}` : ''}`);
    },
    getById: (id: string) =>
      apiRequest<{ test: any; questions: any[] }>(`/tests/${id}`),
    getDemoTests: () => apiRequest<Array<any>>('/tests/demo'),
  },
  packages: {
    getAll: (seriesId?: string) => apiRequest<Array<any>>(`/packages${seriesId ? `?series=${seriesId}` : ''}`),
    getById: (id: string) => apiRequest<any>(`/packages/${id}`),
  },
  purchases: {
    createPaymentOrder: (packageIds: string[], paymentDetails?: { amount?: number; currency?: string; receipt?: string }) =>
      apiRequest<{
        order_id: string;
        amount: number;
        currency: string;
        testIds: string[];
        packageIds: string[];
      }>('/purchases/create-order', {
        method: 'POST',
        body: JSON.stringify({
          packageIds,
          ...(paymentDetails?.amount !== undefined && { amount: paymentDetails.amount }),
          ...(paymentDetails?.currency && { currency: paymentDetails.currency }),
          ...(paymentDetails?.receipt && { receipt: paymentDetails.receipt }),
        }),
      }),
    verifyPayment: (paymentDetails: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) =>
      apiRequest<{
        orderId: string;
        paymentId: string;
        status: string;
      }>('/purchases/verify-payment', {
        method: 'POST',
        body: JSON.stringify(paymentDetails),
      }),
    purchaseTests: (packageIds: string[]) =>
      apiRequest<Array<any>>('/purchases', {
        method: 'POST',
        body: JSON.stringify({ packageIds }),
      }),
    getPurchasedTests: () => apiRequest<Array<any>>('/purchases'),
    checkPurchase: (testId: string) =>
      apiRequest<{ isPurchased: boolean }>(`/purchases/check/${testId}`),
  },
  attempts: {
    create: (testId: string) =>
      apiRequest<{ attemptId: string; testId: string; startedAt: string }>('/attempts', {
        method: 'POST',
        body: JSON.stringify({ testId }),
      }),
    getById: (id: string) =>
      apiRequest<{
        attempt: any;
        questions: any[];
        test?: {
          instructions?: string[];
        };
      }>(`/attempts/${id}`),
    update: (
      id: string,
      data: {
        answers?: Record<string, number>;
        markedQuestions?: string[];
        currentQuestionIndex?: number;
        visitedQuestions?: string[];
      }
    ) =>
      apiRequest<{
        attemptId: string;
        answers: Record<string, number>;
        markedQuestions: string[];
        currentQuestionIndex: number;
        visitedQuestions: string[];
      }>(`/attempts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    start: (id: string) =>
      apiRequest<{ startedAt: string }>(`/attempts/${id}/start`, {
        method: 'POST',
      }),
    submit: (id: string) =>
      apiRequest<{ score: number; totalQuestions: number; percentage: number }>(
        `/attempts/${id}/submit`,
        {
          method: 'POST',
        }
      ),
    getUserAttempts: () => apiRequest<Array<any>>('/attempts'),
    getLeaderboard: (limit?: number) =>
      apiRequest<{
        topPerformers: Array<{
          rank: number;
          userId: string;
          userName: string;
          userEmail: string;
          totalAttempts: number;
          averagePercentage: number;
          bestPercentage: number;
          bestScore: number;
        }>;
        userStats: {
          rank: number | null;
          userName: string;
          totalAttempts: number;
          averagePercentage: number;
          bestPercentage: number;
          bestScore: number;
        };
        totalUsers: number;
      }>(`/attempts/leaderboard${limit ? `?limit=${limit}` : ''}`),
  },
  performance: {
    getPerformance: () => apiRequest<any>('/performance'),
  },
};




