import axios from 'axios'

export const BASE_URL = 'https://mixinsalam.liara.run'  // Direct backend URL

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  withCredentials: true  // Enable credentials for CORS
})

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    // Add cache control headers to response
    response.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
    response.headers['pragma'] = 'no-cache';
    response.headers['expires'] = '0';
    
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
    return Promise.reject(error);
  }
);

export interface ApiError {
  status: number
  message: string
}

export const handleApiError = (error: unknown): never => {
  const message = error instanceof Error ? error.message : 'An unknown error occurred'
  throw new Error(message)
}