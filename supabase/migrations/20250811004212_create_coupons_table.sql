CREATE TYPE coupon_status AS ENUM ('active', 'redeemed', 'expired');

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    
    token_id BIGINT NOT NULL UNIQUE,
    metadata_url TEXT,
    metadata_hash TEXT,
    contract_address VARCHAR(255),
    
    activity_type VARCHAR(100),
    business_name VARCHAR(255),
    location VARCHAR(255),
    
    status coupon_status NOT NULL DEFAULT 'active',
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    redemption_code VARCHAR(100),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT check_expiration_after_creation 
        CHECK (expiration_date > created_at),
    CONSTRAINT check_redeemed_when_status_redeemed 
        CHECK (
            (status = 'redeemed' AND redeemed_at IS NOT NULL) OR 
            (status != 'redeemed' AND redeemed_at IS NULL)
        )
);


CREATE INDEX idx_coupons_user_id ON coupons(user_id);
CREATE INDEX idx_coupons_project_id ON coupons(project_id);
CREATE INDEX idx_coupons_purchase_id ON coupons(purchase_id);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_expiration_date ON coupons(expiration_date);
CREATE INDEX idx_coupons_activity_type ON coupons(activity_type);
CREATE INDEX idx_coupons_created_at ON coupons(created_at);

CREATE INDEX idx_coupons_user_status ON coupons(user_id, status);
CREATE INDEX idx_coupons_status_expiration ON coupons(status, expiration_date);

-- coupons_updated_at_trigger.sql
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupons_set_updated_at ON coupons;
CREATE TRIGGER trg_coupons_set_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- create_active_coupons_view.sql
CREATE OR REPLACE VIEW active_coupons AS
SELECT *
FROM coupons
WHERE status = 'active'
  AND expiration_date > NOW();


-- supabase/migrations/[timestamp]_enable_rls_and_policies_for_coupons.sql
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Example policy: owners can select their coupons
CREATE POLICY "select_own_coupons"
ON coupons
FOR SELECT
USING (user_id = auth.uid());

-- Example policy: owners can insert their coupons
CREATE POLICY "insert_own_coupons"
ON coupons
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Example policy: owners can update their coupons
CREATE POLICY "update_own_coupons"
ON coupons
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());