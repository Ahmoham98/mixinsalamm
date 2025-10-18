export interface MixinCredentials {
  url: string;
  access_token: string;
}

export interface BasalamCredentials {
  access_token: string;
  refresh_token: string;
}

export interface MixinProduct {
  id: number;
  name: string;
  description: string;
  analysis: string;
  english_name: string | null;
  main_category: number;
  other_categories: any[];
  brand: string | null;
  is_digital: boolean;
  price: number;
  compare_at_price: number | null;
  special_offer: boolean;
  special_offer_end: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number;
  barcode: string | null;
  show_price: boolean;
  stock: number;
  stock_type: string;
  max_order_quantity: number;
  min_order_quantity: number;
  guarantee: string | null;
  product_identifier: string | null;
  processing_time: number;
  old_slug: string | null;
  old_path: string | null;
  has_variants: boolean;
  available: boolean;
  draft: boolean;
  seo_title: string;
  seo_description: string;
  extra_fields: any[];  // Array of custom fields
  imageUrl?: string; // Keep this for backward compatibility
}

export interface BasalamPhoto {
  id: number;
  original: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
}

export interface BasalamStatus {
  name: string;
  value: number;
  description: string | null;
}

export interface BasalamShippingData {
  illegal_for_iran: boolean;
  illegal_for_same_city: boolean;
}

export interface BasalamUnitType {
  name: string;
  value: number;
  description: string | null;
}

export interface BasalamProduct {
  id: number;
  title: string;
  price: number;
  description?: string;
  photo: BasalamPhoto;
  photos?: BasalamPhoto[];
  status: BasalamStatus;
  inventory: number;
  primary_price: number | null;
  is_product_for_revision: boolean;
  revision: any | null;
  preparation_day: number;
  published: string | null;
  shipping_data: BasalamShippingData;
  net_weight: number;
  packaged_weight: number;
  net_weight_decimal: number;
  variant: any[];
  unit_quantity: number;
  unit_type: BasalamUnitType;
  sku: string | null;
  discount: any | null;
  is_wholesale: boolean;
}

export interface BasalamProductsResponse {
  data: BasalamProduct[];
  total_count: number;
  result_count: number;
  total_page: number;
  page: number;
  per_page: number;
}

export interface BasalamVendor {
  id: number;
  identifier: string;
  title: string;
  description: string | null;
  is_active: boolean;
  free_shipping_to_iran: boolean | null;
  free_shipping_to_same_city: boolean | null;
  worth_buy: boolean | null;
  created_at: string;
  activated_at: string | null;
  order_count: number;
  status: number;
}

export interface BasalamUserData {
  id: number;
  hash_id: string;
  username: string | null;
  name: string;
  avatar: string | null;
  marked_type: string | null;
  user_follower_count: number;
  user_following_count: number;
  gender: string | null;
  bio: string | null;
  city: string | null;
  created_at: string;
  last_activity: string | null;
  referral_journey_enum: string | null;
  is_banned_in_social: boolean;
  ban_user: Record<string, any>;
  vendor: BasalamVendor;
  email: string | null;
  birthday: string | null;
  national_code: string;
  mobile: string;
  credit_card_number: string | null;
  credit_card_owner: string | null;
  foreign_citizen_code: string | null;
  user_sheba_number: string | null;
  user_sheba_owner: string | null;
  bank_information: string | null;
  bank_information_owner: string | null;
  info_verification_status: {
    name: string;
    value: number;
    description: string;
  };
  referrer_user_id: string | null;
}

export interface MixinValidationResponse {
  message: string;
  "mixin-ceredentials": {
    mixin_url: string;
    access_token: string;
  };
}