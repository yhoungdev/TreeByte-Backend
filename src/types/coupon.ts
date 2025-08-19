export enum CouponStatus {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired'
}

export interface Coupon {
  id: string;

  user_id: string;
  project_id: string;
  purchase_id: number;

  token_id: bigint;
  metadata_url: string | null;
  metadata_hash: string | null;
  contract_address: string | null;
  
  activity_type: string | null;
  business_name: string | null;
  location: string | null;
  
  status: CouponStatus;
  expiration_date: string;
  redemption_code: string | null;
  redeemed_at: string | null; 
  
  created_at: string;
  updated_at: string; 
}


export interface CreateCouponDTO {
  user_id: string;
  project_id: string;
  purchase_id: number;

  token_id: number;
  expiration_date: string; 
  
  metadata_url?: string;
  metadata_hash?: string;
  contract_address?: string;
  
  activity_type?: string;
  business_name?: string;
  location?: string;
  
  status?: CouponStatus; 
  redemption_code?: string;
}

export interface UpdateCouponDTO {
  metadata_url?: string;
  metadata_hash?: string;
  contract_address?: string;
  
  activity_type?: string;
  business_name?: string;
  location?: string;

  status?: CouponStatus;
  expiration_date?: string;
  redemption_code?: string;
  redeemed_at?: string; 
}


export interface CouponSummary {
  id: string;
  token_id: number;
  activity_type: string | null;
  business_name: string | null;
  status: CouponStatus;
  expiration_date: string;
  created_at: string;
}


export interface RedeemCouponDTO {
  redemption_code?: string;
  location?: string; 
}

export interface CouponFilters {
  user_id?: string;
  project_id?: string;
  status?: CouponStatus;
  activity_type?: string;
  business_name?: string;
  location?: string;
  expired?: boolean; 
  expires_before?: string;
  expires_after?: string;
  token_ids?: bigint[]; 
}


export interface CouponQueryOptions {
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'expiration_date' | 'token_id' | 'status';
  sort_order?: 'asc' | 'desc';
  filters?: CouponFilters;
}


export interface CouponQueryResult {
  data: Coupon[];
  total_count: number;
  has_more: boolean;
  next_offset?: number;
}


export const isCouponActive = (coupon: Coupon): boolean => {
  return coupon.status === CouponStatus.ACTIVE && 
         new Date(coupon.expiration_date) > new Date();
};

export const isCouponExpired = (coupon: Coupon): boolean => {
  return new Date(coupon.expiration_date) <= new Date();
};

export const isCouponRedeemed = (coupon: Coupon): boolean => {
  return coupon.status === CouponStatus.REDEEMED;
};


export enum ActivityType {
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
  TOUR = 'tour',
  TRANSPORT = 'transport',
  ATTRACTION = 'attraction',
  EXPERIENCE = 'experience',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment'
}

export interface CouponWithRelations extends Coupon {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  purchase?: {
    id: number;
    amount: number;
    currency: string;
    transaction_hash?: string;
  };
}


export interface CouponValidationRules {
  token_id: {
    required: true;
    type: 'number';
    unique: true;
  };
  expiration_date: {
    required: true;
    type: 'date';
    future: true;
  };
  redemption_code: {
    required: false;
    type: 'string';
    max_length: 100;
  };
}