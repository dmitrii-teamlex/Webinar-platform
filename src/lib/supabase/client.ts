/**
 * Supabase Browser Client — for use in Client Components.
 *
 * Stub: actual initialization requires Supabase credentials.
 * Uncomment and configure when connecting to Supabase.
 */

// import { createBrowserClient } from '@supabase/ssr';
//
// export function createClient() {
//   return createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   );
// }

export function createClient() {
  throw new Error(
    "Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}
