export enum ActivityType {
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
  TOUR = 'tour',
  TRANSPORT = 'transport',
  ATTRACTION = 'attraction',
  EXPERIENCE = 'experience',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment',
  ADVENTURE = 'adventure',
  CULTURAL = 'cultural'
}

export interface CouponAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
}

export interface CouponMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: CouponAttribute[];
  tokenId?: string;
  background_color?: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  contact: {
    phone?: string;
    email?: string;
  };
}

export interface DiscountInfo {
  percentage?: number;
  amount?: number;
  currency?: string;
}

export interface ValidityPeriod {
  valid_from: Date;
  valid_until: Date;
  blackout_dates?: Date[];
}

export interface RedemptionConditions {
  max_guests?: number;
  minimum_spend?: number;
  advance_booking_required?: boolean;
  booking_notice_days?: number;
  terms_and_conditions: string[];
}

export interface ProjectReference {
  project_id: string;
  project_name: string;
  project_url?: string;
}

export interface MetadataGenerationInput {
  coupon_title: string;
  coupon_description: string;
  activity_type: ActivityType;
  business_info: BusinessInfo;
  discount_info: DiscountInfo;
  validity_period: ValidityPeriod;
  redemption_conditions: RedemptionConditions;
  region: string;
  project_reference: ProjectReference;
  image_url?: string;
  custom_attributes?: CouponAttribute[];
}

export interface MetadataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CouponMetadataTemplate {
  name: string;
  description: string;
  attributes: CouponAttribute[];
}

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash: string;
  ipfsUrl: string;
  metadataSize?: number;
}