import { api } from './config'
import type { MixinCredentials, MixinProduct, MixinValidationResponse } from '../../types'

export const mixinApi = {
  validateCredentials: async (url: string, token: string): Promise<MixinValidationResponse> => {
    try {
      console.log('Validating Mixin credentials:', { url, token });
      
      const response = await api.post<MixinValidationResponse>(`/mixin/client/?mixin_url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`);

      console.log('Validation response:', response.data);

      // Check if we have a successful response with the expected structure
      if (response.data && 
          response.data.message === "you are connected successfully!" && 
          response.data["mixin-ceredentials"] && 
          response.data["mixin-ceredentials"].mixin_url && 
          response.data["mixin-ceredentials"].access_token) {
        return response.data;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 403) {
        throw new Error("we can't login with the following credentials");
      } else if (error.response?.status === 404) {
        throw new Error("Invalid data. could be your url or your access token");
      } else if (error.response?.status === 500) {
        throw new Error("some error occurred... could be from server or from our request.");
      }
      throw error;
    }
  },

  getProducts: async (credentials: MixinCredentials, page: number = 1): Promise<MixinProduct[]> => {
    try {
      console.log('Fetching Mixin products with credentials:', {
        url: credentials.url,
        token: credentials.access_token,
        page
      });

      const response = await api.get('/products/my-mixin-products', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        params: {
          mixin_url: credentials.url,
          mixin_page: page,
        },
      });

      console.log('Mixin products response:', response.data);

      // Handle paginated response
      if (response.data?.result && Array.isArray(response.data.result)) {
        return response.data.result;
      }

      // Fallback to direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // Fallback to single item
      if (response.data?.id) {
        return [response.data];
      }

      console.error('Unexpected response format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching Mixin products:', error);
      throw error;
    }
  },

  getProductById: async (credentials: MixinCredentials, productId: number): Promise<MixinProduct | null> => {
    try {
      const response = await api.get(`/products/mixin/${productId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        params: {
          mixin_url: credentials.url,
        },
      })
      return response.data || null
    } catch (error) {
      console.error('Error fetching Mixin product:', error)
      return null
    }
  },

  updateProduct: async (credentials: MixinCredentials, productId: number, productData: any) => {
    if (!credentials.url) {
      throw new Error('Mixin URL not found in credentials')
    }

    try {
      // Get the original product data first
      const originalProduct = await mixinApi.getProductById(credentials, productId)
      if (!originalProduct) {
        throw new Error('Could not fetch original product data')
      }

      // Create updated data by merging original data with new values
      const updatedData = {
        ...originalProduct,
        name: productData.name,
        price: Number(productData.price),
        description: productData.description,
        extra_fields: []  // Always set extra_fields to empty array
      }

      console.log('Sending update request with data:', updatedData)

      const response = await api.put(
        `/products/update/mixin/${productId}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`
          },
          params: {
            mixin_url: credentials.url
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Error updating Mixin product:', error)
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.status === 422) {
          const validationErrors = error.response.data.detail
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map(err => `${err.loc[1]}: ${err.msg}`).join(', ')
            throw new Error(`Validation error: ${errorMessages}`)
          }
        }
        throw new Error(error.response.data.detail || 'Failed to update Mixin product')
      }
      throw new Error('Failed to update Mixin product')
    }
  },

  createProduct: async (credentials: MixinCredentials, productData: {
    name: string;
    main_category: number;
    description?: string;
    analysis?: string;
    english_name?: string;
    other_categories?: number[];
    brand?: number;
    is_digital?: boolean;
    price?: number;
    compare_at_price?: number;
    special_offer?: boolean;
    special_offer_end?: string;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    barcode?: string;
    stock_type?: string;
    stock?: number;
    max_order_quantity?: number;
    guarantee?: string;
    product_identifier?: string;
    old_path?: string;
    old_slug?: string;
    has_variants?: boolean;
    available?: boolean;
    seo_title?: string;
    seo_description?: string;
    extra_fields?: string[];
  }) => {
    if (!credentials.url) {
      throw new Error('Mixin URL not found in credentials')
    }

    try {
      const response = await api.post(
        '/products/create/mixin',
        productData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`
          },
          params: {
            mixin_url: credentials.url
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Error creating Mixin product:', error)
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Failed to create Mixin product')
      }
      throw new Error('Failed to create Mixin product')
    }
  },

  getProductImage: async (credentials: MixinCredentials, productId: number): Promise<string | null> => {
    try {
      const response = await api.get('/images/my-mixin_image', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        params: {
          url: credentials.url,
          mixin_page: 1,
          mixin_product_id: productId
        },
      })
      
      // Check if we have results and at least one image
      if (response.data?.result && response.data.result.length > 0) {
        return response.data.result[0].image
      }
      return null
    } catch (error) {
      console.error('Error fetching Mixin product image:', error)
      return null
    }
  },

  getProductImages: async (credentials: MixinCredentials, productId: number): Promise<string[]> => {
    try {
      const response = await api.get('/images/my-mixin_image', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        params: {
          url: credentials.url,
          mixin_page: 1,
          mixin_product_id: productId
        },
      });
      if (response.data?.result && Array.isArray(response.data.result)) {
        // Ensure the default image (main) comes first
        const items = [...response.data.result];
        items.sort((a: any, b: any) => ((b?.default ? 1 : 0) - (a?.default ? 1 : 0)));
        return items.map((img: any) => img.image).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all Mixin product images:', error);
      return [];
    }
  },

  getProductsCount: async (credentials: MixinCredentials): Promise<number> => {
    try {
      // Get first page to determine total count
      const response = await api.get('/products/my-mixin-products', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        params: {
          mixin_url: credentials.url,
          mixin_page: 1,
        },
      });

      // Check if response has pagination info
      if (response.data?.total_count) {
        return response.data.total_count;
      }
      
      // If no total count, estimate based on first page
      const firstPageProducts = response.data?.result || response.data || [];
      if (Array.isArray(firstPageProducts) && firstPageProducts.length === 100) {
        // If we got exactly 100 products, there might be more pages
        // We'll need to make additional requests to get accurate count
        return 100; // This will be updated when we implement proper counting
      }
      
      return Array.isArray(firstPageProducts) ? firstPageProducts.length : 0;
    } catch (error) {
      console.error('Error fetching Mixin products count:', error);
      return 0;
    }
  },
}