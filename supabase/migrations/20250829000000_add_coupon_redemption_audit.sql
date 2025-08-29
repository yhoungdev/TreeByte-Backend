-- Add redemption transaction hash to coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS redemption_tx_hash TEXT;

-- Create coupon redemption audit table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_hash TEXT,
  location VARCHAR(255),
  notes TEXT,
  business_verification VARCHAR(255),
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_created_at ON coupon_redemptions(created_at);
