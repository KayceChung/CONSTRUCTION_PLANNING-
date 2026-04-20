import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eqhjwicfoyypminlruyo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaGp3aWNmb3l5cG1pbmxydXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwNDMyNTcsImV4cCI6MjAwNjYxOTI1N30.qKJ7Q3X5TqkQ0OMG7CXd_uE0WKvMfzwmS_w9Lrp4e8E'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})

async function activateStaff() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', 'test@example.com')
      .limit(1)
    
    if (error) throw error
    if (!data || data.length === 0) {
      console.log('❌ Staff not found')
      return
    }
    
    const staff = data[0]
    console.log('Found staff:', staff.id, staff.email)
    
    const { error: updateError } = await supabase
      .from('staff')
      .update({ is_active: true })
      .eq('id', staff.id)
    
    if (updateError) throw updateError
    console.log('✅ Staff activated:', staff.email)
  } catch (err) {
    console.error('Error:', err.message)
  }
}

activateStaff()
