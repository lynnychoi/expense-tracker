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

async function applyBudgetMigration() {
  console.log('🚀 Applying budget migration manually...');
  
  try {
    // Read the budget migration file
    const migrationSql = fs.readFileSync('supabase/migrations/20250916000009_budgets.sql', 'utf8');
    
    console.log('📝 Migration file loaded, executing SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      console.error('❌ Error executing migration:', error);
      
      // Try executing parts manually if the RPC doesn't work
      console.log('🔄 Trying to execute SQL statements individually...');
      
      // Split SQL into individual statements
      const statements = migrationSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`📄 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement
          });
          
          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError);
            if (stmtError.message.includes('already exists')) {
              console.log(`⚠️  Table/function already exists, continuing...`);
            } else {
              console.error(`Statement: ${statement}`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }
    
    // Test if tables were created by querying them
    console.log('🔍 Testing created tables...');
    
    const tables = ['budget_categories', 'budgets', 'budget_goals'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error(`❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists and accessible (count: ${count})`);
        }
      } catch (err) {
        console.error(`❌ Error testing table ${table}:`, err.message);
      }
    }
    
    console.log('🎉 Budget migration application completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyBudgetMigration();