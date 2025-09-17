const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    // Read the budget migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250916000009_budgets.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('Applying budget migration...')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      console.error('Migration failed:', error)
      return
    }
    
    console.log('Migration applied successfully!')
    
  } catch (err) {
    console.error('Error applying migration:', err)
  }
}

applyMigration()