import { api, handleApiError } from './config'
import type { BasalamCredentials, BasalamProduct, BasalamUserData, BasalamProductsResponse } from '../../types'
import { AxiosError } from 'axios'

export const basalamApi = {
  getAccessToken: async (code: string, state: string) => {
    try {
      console.log('Exchanging code for token:', { code, state })
      const response = await api.post('/basalam/client/get-user-access-token/', {
        code,
        state
      })
      console.log('Token exchange response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error exchanging code for access token:', error)
      if (error instanceof AxiosError && error.response) {
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
      }
      throw error
    }
  },

  getUserData: async (credentials: BasalamCredentials): Promise<BasalamUserData | null> => {
    try {
      const response = await api.get('/basalam/client/me', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  },

  getProducts: async (credentials: BasalamCredentials, vendorId: number): Promise<BasalamProduct[]> => {
    try {
      console.log('Fetching Basalam products with credentials:', {
        vendorId,
        token: credentials.access_token
      });

      const response = await api.get<BasalamProductsResponse>(`/products/my-basalam-products/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        params: {
          basalam_page: 1,
        },
      });

      console.log('Basalam products response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.error('Unexpected response format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching Basalam products:', error);
      throw error;
    }
  },

  getProductById: async (credentials: BasalamCredentials, productId: number): Promise<BasalamProduct | null> => {
    try {
      const response = await api.get<BasalamProduct>(`/products/basalam/${productId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      });
      return response.data || null;
    } catch (error) {
      console.error('Error fetching Basalam product:', error);
      return null;
    }
  },

  updateProduct: async (credentials: BasalamCredentials, productId: number, productData: { name: string; price: number }) => {
    try {
    const formData = new FormData()
    formData.append('name', productData.name)
    formData.append('price', productData.price.toString())

      const response = await api.patch(
        `/products/update/basalam/${productId}`,
        formData,
      {
        headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'multipart/form-data'
          }
      }
    )

      if (!response.data) {
        throw new Error('No data received in response')
      }

      return response.data
    } catch (error) {
      console.error('Error updating Basalam product:', error)
      if (error instanceof AxiosError && error.response) {
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
        throw new Error(error.response.data?.message || 'Failed to update Basalam product')
      }
      throw new Error('Failed to update Basalam product')
    }
  }
}