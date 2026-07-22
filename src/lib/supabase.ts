import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { km } from "@/lib/km";

let client: SupabaseClient | null = null;

const PLACEHOLDER_KEYS = new Set([
  "",
  "your-supabase-anon-key",
  "your_anon_key",
]);

function getJwtRole(key: string): string | null {
  try {
    const parts = key.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { role?: string };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isValidSupabaseClientKey(key: string): boolean {
  if (PLACEHOLDER_KEYS.has(key)) return false;

  if (key.startsWith("sb_publishable_")) {
    return key.length > 20;
  }

  if (key.startsWith("sb_secret_")) {
    return false;
  }

  if (!key.startsWith("eyJ") || key.length < 100) {
    return false;
  }

  return getJwtRole(key) === "anon";
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  return isValidSupabaseClientKey(key);
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    throw new Error(km.authNotConfigured);
  }

  client = createClient(url!, key!);
  return client;
}

export function getSupabaseConfigIssue(): string | null {
  if (isSupabaseConfigured()) return null;

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key?.startsWith("sb_secret_")) {
    return km.authWrongKey;
  }
  if (key && getJwtRole(key) === "service_role") {
    return km.authWrongKey;
  }
  return km.authNotConfigured;
}

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid api key")) {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (key?.startsWith("sb_secret_") || getJwtRole(key ?? "") === "service_role") {
      return km.authWrongKey;
    }
    return km.authNotConfigured;
  }
  if (lower.includes("invalid login credentials")) {
    return km.invalidCredentials;
  }
  if (lower.includes("user already registered")) {
    return km.emailAlreadyRegistered;
  }
  if (lower.includes("email not confirmed")) {
    return km.emailNotConfirmed;
  }
  if (lower.includes("rate limit") || lower.includes("over_email_send_rate_limit")) {
    return km.emailRateLimit;
  }
  if (lower.includes("password")) {
    return km.registerFailed;
  }
  return message;
}
