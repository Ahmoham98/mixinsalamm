// services/api/basalam.ts
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
            // 'Content-Type': 'multipart/form-data' // Axios handles this automatically for FormData
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
   * آپلود یک تصویر به باسلام (از طریق بک‌اند واسط).
   * این تابع انتظار دارد یک Blob (مثلاً از یک فایل تصویری) را دریافت کند.
   *
   * @param credentials اعتبارنامه‌های باسلام.
   * @param imageData Blob تصویر محصول.
   * @param filename نام فایل تصویر (اختیاری، پیش‌فرض 'product_image.jpeg').
   * @returns Promise حاوی imageId.
   */
  uploadImage: async (
    credentials: BasalamCredentials,
    imageData: Blob, // این همچنان یک Blob می‌پذیرد، طبق بحث قبلی برای multipart/form-data
    filename: string = 'product_image.jpeg'
  ): Promise<{ imageId: string }> => {
    try {
      console.log(`Uploading image (Blob) with filename: ${filename}`);
      const formData = new FormData();
      // 'photo' باید نام فیلد مورد انتظار بک‌اند شما باشد
      formData.append('photo', imageData, filename);

      const response = await api.post(
        // ****** تنها تغییر اینجاست: آدرس آپلود اصلاح شد ******
        '/products/upload-image', // URI صحیح بر اساس بازخورد شما
        formData,
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            // 'Content-Type': 'multipart/form-data'  // Axios این را برای FormData به صورت خودکار تنظیم می‌کند
          },
        }
      );

      const imageId = response.data?.imageId; // فرض می‌شود پاسخ حاوی imageId است
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

  /**
   * ایجاد یک محصول جدید در باسلام.
   */
  createProduct: async (
    credentials: BasalamCredentials,
    productData: {
      name: string;
      category: string;
      status: string;
      price: number;
      preparationDays: number;
      weight: number;
      packageWeight: number;
      imageId: string;
      description?: string;
    }
  ): Promise<any> => {
    try {
      console.log('Creating new Basalam product:', productData.name);
      // ساخت FormData برای ارسال داده‌های محصول
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('category_id', productData.category); // اطمینان حاصل کنید نام فیلد صحیح است (category_id یا category)
      formData.append('status', productData.status);
      formData.append('price', productData.price.toString());
      formData.append('preparation_days', productData.preparationDays.toString());
      formData.append('weight', productData.weight.toString());
      formData.append('package_weight', productData.packageWeight.toString());
      formData.append('photo_id', productData.imageId); // اطمینان حاصل کنید نام فیلد صحیح است (photo_id یا image_id)
      if (productData.description) {
        formData.append('description', productData.description);
      }

      const response = await api.post(
        '/products/create/basalam', // روت واسط بک‌اند برای ایجاد محصول باسلام
        formData, // ارسال FormData
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            // 'Content-Type': 'multipart/form-data' // Axios این را به صورت خودکار تنظیم می‌کند
          },
        }
      );

      if (!response.data) {
        throw new Error('No response data from createProduct');
      }
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error creating Basalam product');
      throw error;
    }
  },
};