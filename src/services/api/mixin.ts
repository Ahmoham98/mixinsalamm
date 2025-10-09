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

  // Batch fetch mixin products by IDs via backend parallel endpoint
  getProductsByIds: async (
    credentials: MixinCredentials,
    ids: number[]
  ): Promise<Record<number, MixinProduct>> => {
    try {
      if (!ids || ids.length === 0) return {}
      const response = await api.post(
        `/products/mixin/productids?mixin_url=${encodeURIComponent(credentials.url)}`,
        { ids },
        { headers: { Authorization: `Bearer ${credentials.access_token}` } }
      )

      const data = response.data
      const resultArray = Array.isArray(data?.products) ? data.products : []
      const map: Record<number, MixinProduct> = {}
      for (const item of resultArray) {
        const id = Number(item?.id ?? item?.data?.id)
        const prod = (item?.data || item) as MixinProduct
        if (Number.isFinite(id) && prod) {
          map[id] = prod
        }
      }
      return map
    } catch (error) {
      console.error('Error fetching batch Mixin products by ids:', error)
      return {}
    }
  },

  updateProduct: async (credentials: MixinCredentials, productId: number, productData: { name: string; price: number; description: string; stock: number; weight: number }) => {
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
        stock: productData.stock,
        weight: productData.weight,
        extra_fields: []  // Always set extra_fields to empty array
      }


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
      // Preserve Axios-like error so callers can branch on response.status (e.g., 404)
      throw error
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
      let page = 1;
      let total = 0;
      // Loop through pages until no results or backend signals end (404 or empty)
      // Safety cap to avoid infinite loops
      const maxPages = 100;
      while (page <= maxPages) {
        const response = await api.get('/products/my-mixin-products', {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
          },
          params: {
            mixin_url: credentials.url,
            mixin_page: page,
          },
        });

        const items = (response.data?.result && Array.isArray(response.data.result))
          ? response.data.result
          : (Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []));

        if (!items || items.length === 0) {
          break;
        }
        total += items.length;

        // If pagination metadata exists, use it to exit early
        const totalPages = Number(response.data?.total_pages || response.data?.total_page);
        const currentPage = Number(response.data?.current_page || page);
        if (totalPages && currentPage >= totalPages) {
          break;
        }

        page += 1;
      }
      return total;
    } catch (error: any) {
      // If we hit a 404 after finishing pages, return accumulated count
      if (error?.response?.status === 404) {
        return 0; // caller can trigger a recount later; avoid throwing
      }
      console.error('Error fetching Mixin products count:', error);
      return 0;
    }
  },
}