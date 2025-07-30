ALTER TABLE projects 
ADD COLUMN transaction_hash VARCHAR(64);

COMMENT ON COLUMN projects.transaction_hash IS 'Soroban contract deployment transaction hash';