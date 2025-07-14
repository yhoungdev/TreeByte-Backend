CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  photo_url TEXT NOT NULL,
  impact VARCHAR(255) NOT NULL,
  asset_code VARCHAR(12) NOT NULL,
  issuer_public_key VARCHAR(56) NOT NULL,
  supply BIGINT NOT NULL,
  ipfs_url TEXT,
  ipfs_hash VARCHAR(255),
  contract_id VARCHAR(56),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
