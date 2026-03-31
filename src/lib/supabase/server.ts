/**
 * Supabase Server Client — for use in Server Components, Route Handlers, Server Actions.
 *
 * Stub: actual initialization requires Supabase credentials.
 */

// import { createServerClient } from '@supabase/ssr';
// import { cookies } from 'next/headers';
//
// export async function createServerSupabaseClient() {
//   const cookieStore = await cookies();
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() { return cookieStore.getAll(); },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           );
//         },
//       },
//     }
//   );
// }

export async function createServerSupabaseClient() {
  throw new Error(
    "Supabase server client not configured. Set environment variables."
  );
}
