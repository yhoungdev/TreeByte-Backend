-- migrate:up
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  amount INTEGER NOT NULL,
  purchase_date TIMESTAMP DEFAULT NOW()
);
