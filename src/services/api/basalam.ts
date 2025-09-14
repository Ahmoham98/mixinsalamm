import { api, BASE_URL } from './config'
import type { BasalamCredentials, BasalamProduct, BasalamUserData, BasalamProductsResponse } from '../../types'
import { AxiosError } from 'axios'

export const basalamApi = {
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

  getProducts: async (credentials: BasalamCredentials, vendorId: number, page: number = 1): Promise<BasalamProduct[]> => {
    try {
      console.log('=== Basalam Products Request Debug ===');
      console.log('Vendor ID:', vendorId);
      console.log('Access Token:', credentials.access_token);
      console.log('Page:', page);
      console.log('Full Request URL:', `${BASE_URL}/products/my-basalam-products/${vendorId}`);
      console.log('Request Headers:', {
        Authorization: `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
      console.log('Request Params:', { basalam_page: page });
      
      const response = await api.get<BasalamProductsResponse>(`/products/my-basalam-products/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        params: {
          basalam_page: page,
        },
      });

      console.log('=== Basalam Products Response Debug ===');
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);
      console.log('Raw Response Data:', response.data);

      if (!response.data) {
        console.error('No data received in response');
        return [];
      }

      // Return the data array from the response
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log('Returning data array from response.data.data');
        // Validate each product has required fields
        const validProducts = response.data.data.filter(product => {
          if (!product || typeof product !== 'object') {
            console.error('Invalid product:', product);
            return false;
          }
          if (!product.id || !product.title || typeof product.price !== 'number') {
            console.error('Product missing required fields:', product);
            return false;
          }
          return true;
        });
        return validProducts;
      }

      console.error('Unexpected response format:', response.data);
      return [];
    } catch (error) {
      console.error('=== Basalam Products Error Debug ===');
      console.error('Error:', error);
      if (error instanceof AxiosError && error.response) {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Status:', error.response.status);
        console.error('Error Headers:', error.response.headers);
        console.error('Request Config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          params: error.config?.params
        });

        // Handle specific error cases
        if (error.response.status === 404) {
          console.error('Product endpoint not found. Please check the API endpoint.');
        } else if (error.response.status === 401) {
          console.error('Unauthorized. Please check your access token.');
        } else if (error.response.status === 403) {
          console.error('Forbidden. You may not have permission to access these products.');
        }
      }
      return [];
    }
  },

  getProductById: async (credentials: BasalamCredentials, productId: number): Promise<BasalamProduct | null> => {
    try {
      const response = await api.get(`/products/basalam/${productId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      })
      return response.data || null
    } catch (error) {
      console.error('Error fetching Basalam product:', error)
      return null
    }
  },

  updateProduct: async (credentials: BasalamCredentials, productId: number, productData: { name: string; price: number; description?: string; stock: number; weight: number }) => {
    try {
      const formData = new FormData()
      formData.append('name', productData.name)
      formData.append('price', productData.price.toString())
      formData.append('stock', productData.stock.toString()) // stock
      formData.append('weight', productData.weight.toString()) // weight
      if (productData.description !== undefined) {
        formData.append('description', productData.description)
      }
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
  },

  uploadImage: async (credentials: BasalamCredentials, imageUrl: string): Promise<{ id: number; url: string }> => {
    try {
      // Use the new sync-image endpoint that handles downloading and uploading on the backend
      const response = await api.post(`/products/sync-image?image_url=${encodeURIComponent(imageUrl)}`, null, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Handle the actual response format from /sync-image endpoint
      // Direct object format: { "id": 254575240, "urls": { "primary": "https://..." }, ... }
      if (response.data?.id && response.data?.urls?.primary) {
        console.log('Image upload successful:', { id: response.data.id, url: response.data.urls.primary })
        return { 
          id: response.data.id, 
          url: response.data.urls.primary 
        }
      }
      
      // Fallback: check for nested response format (in case backend changes)
      if (response.data?.response?.data?.files?.[0]) {
        const file = response.data.response.data.files[0]
        return { id: file.id, url: file.url }
      } else if (response.data?.data?.files?.[0]) {
        const file = response.data.data.files[0]
        return { id: file.id, url: file.url }
      }
      
      console.log('Unexpected response format:', response.data)
      throw new Error('Invalid response format from image upload')
    } catch (error) {
      console.error('Error uploading image to Basalam:', error)
      throw new Error(`Failed to upload image to Basalam: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  createProduct: async (credentials: BasalamCredentials, vendorId: number, productData: any) => {
    try {
      const response = await api.post(`/products/create/basalam/${vendorId}`, productData, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error creating Basalam product:', error)
      throw new Error('Failed to create Basalam product')
    }
  },

  getProductsCount: async (credentials: BasalamCredentials, vendorId: number): Promise<number> => {
    try {
      let page = 1;
      let total = 0;
      const maxPages = 100;
      while (page <= maxPages) {
        const response = await api.get<BasalamProductsResponse>(`/products/my-basalam-products/${vendorId}`, {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          params: {
            basalam_page: page,
          },
        });

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        if (!items || items.length === 0) {
          break;
        }
        total += items.length;

        const totalPages = Number(response.data?.total_page);
        const currentPage = Number(response.data?.page || page);
        if (totalPages && currentPage >= totalPages) {
          break;
        }
        page += 1;
      }
      return total;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return 0;
      }
      console.error('Error fetching Basalam products count:', error);
      return 0;
    }
  },

  getCategoryUnitType: async (credentials: BasalamCredentials, categoryId: number): Promise<{ unit_type: { id: number; title: string } | null } | null> => {
    try {
      const response = await api.get(`/products/category-unit-type?category_id=${categoryId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      });
      
      // Handle both response formats
      if (response.data?.unit_type) {
        return response.data;
      } else if (response.data?.data?.[0]?.unit_type) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching category unit type:', error);
      return null;
    }
  }
}