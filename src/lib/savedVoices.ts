import { createClient } from "@supabase/supabase-js";

export type SavedVoice = {
  id: string;
  name: string;
  audio_path: string;
  original_filename: string | null;
  created_at: string;
};

export function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}
