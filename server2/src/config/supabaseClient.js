import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Debug environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set in environment variables');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
