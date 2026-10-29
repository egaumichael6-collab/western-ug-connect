import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).",
  );
}

export const supabase = createClient(url ?? "https://not-configured.supabase.co", anonKey ?? "not-configured", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
});

/** Turn a Supabase / Postgres error into a sentence a member can act on. */
export function friendlyError(err: unknown): string {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Something went wrong. Please try again.";
  const map: Record<string, string> = {
    membership_required: "This feature needs an active membership. Choose a package to continue.",
    diamond_required: "Diamond profiles are only available to Diamond members.",
    campus_required: "The University section is only available to Juicy University Babes members.",
    profile_unavailable: "This profile is not available.",
    "Invalid login credentials": "Incorrect email or password.",
    "Email not confirmed": "Please confirm your email address first — check your inbox for the verification link.",
    "Database error saving new user":
      "We could not create your account. Check that you are 18 or older and that all details are valid.",
    "Failed to fetch": "Network problem — check your internet connection and try again.",
  };
  for (const [k, v] of Object.entries(map)) if (raw.includes(k)) return v;
  return raw;
}

export function isMembershipError(err: unknown) {
  const m = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "";
  return m.includes("membership_required") || m.includes("diamond_required") || m.includes("campus_required");
}

const urlCache = new Map<string, { url: string; exp: number }>();

/** Short-lived signed URL for a private photo; storage policies decide who may see it. */
export async function signedPhotoUrl(path: string | null | undefined, bucket = "profile-photos") {
  if (!path) return null;
  const key = `${bucket}:${path}`;
  const hit = urlCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return null;
  urlCache.set(key, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}
