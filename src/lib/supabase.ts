import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Create admin client for server-side operations (use carefully)
export function createAdminClient() {
  // Only use on server side or for specific admin operations
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should not be used on client side')
  }
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Export a default client instance for convenience
export const supabase = createClient()