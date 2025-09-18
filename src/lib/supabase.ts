import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, environment variables might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found, using placeholder client')
    // Return a placeholder client for build time
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Create admin client for server-side operations (use carefully)
export function createAdminClient() {
  // Only use on server side or for specific admin operations
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should not be used on client side')
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase admin environment variables not found, using placeholder client')
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-service-role-key'
    )
  }
  
  return createBrowserClient(supabaseUrl, serviceRoleKey)
}

// Export a default client instance for convenience
export const supabase = createClient()