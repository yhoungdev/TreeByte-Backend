export interface User {
  id: string;
  email: string;
  public_key: string;
  secret_key_enc: string | null;
  auth_method: 'external' | 'invisible' | string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  photo_url: string;
  impact: string;
  asset_code: string;
  issuer_public_key: string;
  supply: number;
  ipfs_url?: string | null;
  ipfs_hash?: string | null;
  contract_id?: string | null;
  transaction_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  user_id: string;
  project_id: string;
  amount: number;
  purchase_date: string;
}

export type QueryFilters<T> = Partial<{ [K in keyof T]: T[K] }> & {
  search?: string;
};

export interface Pagination {
  page: number;
  limit: number;
}
