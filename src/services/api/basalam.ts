import { api, handleApiError } from './config';
import type {
  BasalamCredentials,
  BasalamProduct,
  BasalamUserData,
  BasalamProductsResponse
} from '../../types';
import { AxiosError } from 'axios';

export const basalamApi = {
  /**
   * دریافت اطلاعات کاربر باسلام.
   */
  getUserData: async (
    credentials: BasalamCredentials
  ): Promise<BasalamUserData | null> => {
    try {
      console.log('Fetching Basalam user data...');
      const response = await api.get('/basalam/client/me', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      });
      console.log('User data fetched:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching Basalam user data');
      throw error;
    }
  },

  /**
   * دریافت لیست محصولات باسلام برای فروشنده مشخص.
   */
  getProducts: async (
    credentials: BasalamCredentials,
    vendorId: number
  ): Promise<BasalamProduct[]> => {
    try {
      console.log('Fetching products for vendor:', vendorId);
      const response = await api.get<BasalamProductsResponse>(
        `/products/my-basalam-products/${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          params: {
            basalam_page: 1,
          },
        }
      );

      const products = response.data?.data ?? [];
      const validProducts = products.filter(
        (product) =>
          product &&
          typeof product === 'object' &&
          product.id &&
          product.title &&
          typeof product.price === 'number'
      );

      console.log(`Fetched ${validProducts.length} valid products.`);
      return validProducts;
    } catch (error) {
      handleApiError(error, 'Error fetching Basalam products');
      throw error;
    }
  },

  /**
   * دریافت اطلاعات یک محصول با شناسه مشخص.
   */
  getProductById: async (
    credentials: BasalamCredentials,
    productId: number
  ): Promise<BasalamProduct | null> => {
    try {
      console.log(`Fetching product with ID: ${productId}`);
      const response = await api.get(`/products/basalam/${productId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      });
      return response.data || null;
    } catch (error) {
      handleApiError(error, `Error fetching product ID: ${productId}`);
      throw error;
    }
  },

  /**
   * به‌روزرسانی اطلاعات یک محصول باسلام.
   */
  updateProduct: async (
    credentials: BasalamCredentials,
    productId: number,
    productData: { name: string; price: number }
  ): Promise<any> => {
    try {
      console.log(`Updating product ID: ${productId}`);
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('price', productData.price.toString());

      const response = await api.patch(
        `/products/update/basalam/${productId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data) {
        throw new Error('No response data from updateProduct');
      }

      return response.data;
    } catch (error) {
      handleApiError(error, `Error updating product ID: ${productId}`);
      throw error;
    }
  },

  /**
   * آپلود تصویر از طریق URL به باسلام.
   */
  uploadImage: async (
    credentials: BasalamCredentials,
    imageUrl: string
  ): Promise<{ imageId: string }> => {
    try {
      console.log(`Uploading image from URL: ${imageUrl}`);
      const response = await api.post(
        '/products/upload-image-to-basalam',
        { imageUrl },
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const imageId = response.data?.imageId;
      if (!imageId) {
        throw new Error('No imageId returned from upload API.');
      }

      console.log(`Image uploaded. ID: ${imageId}`);
      return { imageId };
    } catch (error) {
      handleApiError(error, 'Error uploading image');
      throw error;
    }
  },
};
