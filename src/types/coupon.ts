export type CouponStatus = 'active' | 'redeemed' | 'expired';

export interface Coupon {
  id: string;
  userId: string;
  projectId: string;
  purchaseId: number;
  tokenId: number;
  metadataUrl: string | null;
  metadataHash: string | null;
  contractAddress: string | null;
  activityType: string | null;
  businessName: string | null;
  location: string | null;
  status: CouponStatus;
  expirationDate: string; // ISO timestamp
  redemptionCode: string | null;
  redeemedAt: string | null; // ISO timestamp or null
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type CreateCouponDTO = {
  userId: string;
  projectId: string;
  purchaseId: number;
  tokenId: number;
  expirationDate: string; // ISO timestamp, must be in the future
  metadataUrl?: string | null;
  metadataHash?: string | null;
  contractAddress?: string | null;
  activityType?: string | null;
  businessName?: string | null;
  location?: string | null;
  redemptionCode?: string | null;
};

export type UpdateCouponDTO = Partial<{
  metadataUrl: string | null;
  metadataHash: string | null;
  contractAddress: string | null;
  activityType: string | null;
  businessName: string | null;
  location: string | null;
  expirationDate: string; // ISO timestamp, must be in the future
  redemptionCode: string | null;
  status: Extract<CouponStatus, 'redeemed' | 'expired'>; // enforce transitions from active
}>;