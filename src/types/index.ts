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
  price: number;
  description: string;
  // Add other fields as needed
}

export interface BasalamProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  // Add other fields as needed
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