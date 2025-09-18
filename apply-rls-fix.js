const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRlsFix() {
  console.log('🚀 Temporarily disabling RLS for debugging...');
  
  try {
    // Read the RLS fix SQL
    const fixSql = fs.readFileSync('test-rls-fix.sql', 'utf8');
    
    console.log('📝 Executing RLS fix SQL...');
    
    // Split SQL into individual statements
    const statements = fixSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`📄 Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 RLS fix application completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyRlsFix();