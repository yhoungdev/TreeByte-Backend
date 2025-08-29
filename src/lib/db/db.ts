import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/app-config';

const supabase = createClient(
  config.database.url,
  config.database.key
);

export default supabase;
