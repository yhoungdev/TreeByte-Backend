CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  amount FLOAT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
