import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useGlobalUiStore } from '../../store/globalUiStore'

export const BASE_URL = 'https://mixinsalam-backend.liara.run'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Attach Authorization header from persisted credentials, without overriding explicit headers
api.interceptors.request.use((config) => {
  try {
    const hasAuthHeader = !!config.headers?.Authorization
    if (!hasAuthHeader) {
      const token = useAuthStore.getState().basalamCredentials?.access_token
      console.log('API Request Interceptor - Token check:', {
        hasAuthHeader,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
        url: config.url
      })
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
        console.log('Authorization header added:', `Bearer ${token.substring(0, 20)}...`)
      } else {
        console.warn('No Basalam token available for request:', config.url)
      }
    }
  } catch (error) {
    console.error('Error in request interceptor:', error)
  }
  return config
})

// Add response interceptor for debugging and global 401 handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers
    });
    if (error.response && error.response.status === 401) {
      // Global 401 handler
      const setShowTokenExpiredModal = useGlobalUiStore.getState().setShowTokenExpiredModal;
      const clearCredentials = useAuthStore.getState().clearCredentials;
      setShowTokenExpiredModal(true);
      clearCredentials();
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();
      setTimeout(() => {
        setShowTokenExpiredModal(false);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 4000);
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string
}

export const handleApiError = (error: unknown): never => {
  const message = error instanceof Error ? error.message : 'An unknown error occurred'
  throw new Error(message)
}