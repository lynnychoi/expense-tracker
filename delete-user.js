const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = 'https://laumguwzpjirbuldfozz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdW1ndXd6cGppcmJ1bGRmb3p6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk5MTQ5NCwiZXhwIjoyMDczNTY3NDk0fQ.Ao4392828MVv2dS647Q40F7TueL1kh46u7V776vKDLw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(email) {
  try {
    // First, get the user by email
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found with email:', email);
      return;
    }

    console.log('Found user:', user.id, user.email);

    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return;
    }

    console.log('Successfully deleted user:', email);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Delete the user
deleteUser('lynn.y.choii@gmail.com');