// basalam.ts
import { api, handleApiError } from './config';
import type { BasalamCredentials, BasalamProduct, BasalamUserData, BasalamProductsResponse } from '../../types';
import { AxiosError } from 'axios';

export const basalamApi = {
  /**
   * دریافت اطلاعات کاربر باسلام.
   * @param credentials اطلاعات احراز هویت باسلام (access_token).
   * @returns اطلاعات کاربر یا null در صورت خطا.
   */
  getUserData: async (credentials: BasalamCredentials): Promise<BasalamUserData | null> => {
    try {
      console.log('Fetching Basalam user data...');
      const response = await api.get('/basalam/client/me', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      });
      console.log('Basalam user data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching Basalam user data');
      throw error; // خطا را برای مدیریت در UI پرتاب می‌کنیم
    }
  },

  /**
   * دریافت لیست محصولات باسلام برای یک فروشنده.
   * @param credentials اطلاعات احراز هویت باسلام (access_token).
   * @param vendorId شناسه فروشنده باسلام.
   * @returns آرایه‌ای از محصولات باسلام.
   */
  getProducts: async (credentials: BasalamCredentials, vendorId: number): Promise<BasalamProduct[]> => {
    try {
      console.log('--- Basalam Products Request Start ---');
      console.log(`Fetching Basalam products for Vendor ID: ${vendorId}`);
      console.log('Request URL:', `/products/my-basalam-products/${vendorId}`);
      // Token و Headerها در تنظیمات Axios 'api' باید به درستی مدیریت شوند.
      // لاگ کامل توکن را برای امنیت کمتر می‌کنیم.
      console.log('Access Token is present.');

      const response = await api.get<BasalamProductsResponse>(`/products/my-basalam-products/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        params: {
          basalam_page: 1, // یا هر صفحه دیگری که نیاز دارید
        },
      });

      console.log('--- Basalam Products Response End ---');
      console.log('Response Status:', response.status);

      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('Basalam products response data is invalid:', response.data);
        throw new Error('Unexpected response format for Basalam products.');
      }

      const validProducts = response.data.data.filter(product => {
        const isValid = product && typeof product === 'object' && product.id && product.title && typeof product.price === 'number';
        if (!isValid) {
          console.warn('Invalid product found in Basalam products list, skipping:', product);
        }
        return isValid;
      });

      console.log(`Found ${validProducts.length} valid Basalam products.`);
      return validProducts;
    } catch (error) {
      handleApiError(error, 'Error fetching Basalam products');
      throw error; // خطا را برای مدیریت در UI پرتاب می‌کنیم
    }
  },

  /**
   * دریافت جزئیات یک محصول باسلام با شناسه آن.
   * @param credentials اطلاعات احراز هویت باسلام.
   * @param productId شناسه محصول باسلام.
   * @returns جزئیات محصول باسلام یا null.
   */
  getProductById: async (credentials: BasalamCredentials, productId: number): Promise<BasalamProduct | null> => {
    try {
      console.log(`Fetching Basalam product with ID: ${productId}`);
      const response = await api.get(`/products/basalam/${productId}`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      });
      console.log(`Basalam product ${productId} fetched successfully.`);
      return response.data || null;
    } catch (error) {
      handleApiError(error, `Error fetching Basalam product with ID: ${productId}`);
      throw error; // خطا را برای مدیریت در UI پرتاب می‌کنیم
    }
  },

  /**
   * به‌روزرسانی اطلاعات یک محصول در باسلام.
   * @param credentials اطلاعات احراز هویت باسلام.
   * @param productId شناسه محصول باسلام برای به‌روزرسانی.
   * @param productData داده‌های محصول برای به‌روزرسانی (نام و قیمت).
   * @returns پاسخ API باسلام پس از به‌روزرسانی.
   */
  updateProduct: async (credentials: BasalamCredentials, productId: number, productData: { name: string; price: number }) => {
    try {
      console.log(`Updating Basalam product with ID: ${productId}`);
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('price', productData.price.toString());

      const response = await api.patch(
        `/products/update/basalam/${productId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'multipart/form-data', // برای FormData نیاز است
          }
        }
      );

      if (!response.data) {
        throw new Error('No data received in response after Basalam product update.');
      }

      console.log(`Basalam product ${productId} updated successfully.`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Error updating Basalam product with ID: ${productId}`);
      throw error; // خطا را برای مدیریت در UI پرتاب می‌کنیم
    }
  },

  /**
   * آپلود یک تصویر به باسلام از طریق URL.
   * این متد فرض می‌کند که یک بک‌اند واسط (proxy) دارید که این URL را دریافت کرده، تصویر را دانلود و سپس به API باسلام آپلود می‌کند.
   * @param credentials اطلاعات احراز هویت باسلام.
   * @param imageUrl آدرس URL تصویر (مثلاً از میکسین).
   * @returns شیء شامل imageId بازگردانده شده از باسلام.
   */
  uploadImage: async (credentials: BasalamCredentials, imageUrl: string): Promise<{ imageId: string }> => {
    try {
      console.log(`Attempting to upload image to Basalam from URL: ${imageUrl}`);

      // این آدرس باید به Endpoint آپلود تصویر در بک‌اند واسط شما اشاره کند.
      // مثلا: https://mixinsalama.liara.run/api/upload-basalam-image
      const response = await api.post(
        '/products/upload-image-to-basalam', // این Endpoint را باید در بک‌اند خود پیاده‌سازی کنید
        { imageUrl }, // ارسال URL تصویر به بک‌اند
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`, // اگر بک‌اند به توکن باسلام نیاز دارد
            'Content-Type': 'application/json',
          },
        }
      );

      // فرض می‌کنیم بک‌اند واسط شما imageId را از باسلام گرفته و در response.data.imageId برمی‌گرداند.
      if (response.data && response.data.imageId) {
        console.log("Image successfully uploaded to Basalam. Received Image ID:", response.data.imageId);
        return { imageId: response.data.imageId };
      } else {
        throw new Error('Invalid response from image upload proxy: imageId not found.');
      }
    } catch (error) {
      handleApiError(error, `Error uploading image to Basalam from URL: ${imageUrl}`);
      throw error; // خطا را برای مدیریت در UI پرتاب می‌کنیم
    }
  },
};
