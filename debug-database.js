const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDatabase() {
  console.log('🔍 Debugging database with service role key...');
  
  try {
    // Check households table
    console.log('\n📊 Checking households table...');
    const { data: households, error: householdsError } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (householdsError) {
      console.error('❌ Error querying households:', householdsError);
    } else {
      console.log(`✅ Found ${households.length} households:`, households.map(h => ({
        id: h.id,
        name: h.name,
        created_by: h.created_by,
        created_at: h.created_at
      })));
    }

    // Check household_members table
    console.log('\n👥 Checking household_members table...');
    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('*')
      .order('joined_at', { ascending: false })
      .limit(5);

    if (membersError) {
      console.error('❌ Error querying household_members:', membersError);
    } else {
      console.log(`✅ Found ${members.length} household members:`, members.map(m => ({
        id: m.id,
        household_id: m.household_id,
        user_id: m.user_id,
        joined_at: m.joined_at,
        removed_at: m.removed_at
      })));
    }

    // Check users table  
    console.log('\n👤 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Error querying users:', usersError);
    } else {
      console.log(`✅ Found ${users.length} users:`, users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        created_at: u.created_at
      })));
    }

    // Check if there are any recent records created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    console.log('\n🕐 Checking recent records (last hour)...');
    
    const { data: recentHouseholds, error: recentHouseholdsError } = await supabase
      .from('households')
      .select('*')
      .gte('created_at', oneHourAgo);

    if (!recentHouseholdsError) {
      console.log(`📈 Recent households: ${recentHouseholds.length}`);
    }

    const { data: recentMembers, error: recentMembersError } = await supabase
      .from('household_members')
      .select('*')
      .gte('joined_at', oneHourAgo);

    if (!recentMembersError) {
      console.log(`📈 Recent members: ${recentMembers.length}`);
    }

    console.log('\n🏁 Database debug completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugDatabase();