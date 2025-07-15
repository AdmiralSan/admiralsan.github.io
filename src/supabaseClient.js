import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djnpaprirlimyofjdplo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbnBhcHJpcmxpbXlvZmpkcGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODAyNzAsImV4cCI6MjA2NTE1NjI3MH0.xLbD7UsETRK3yM_8qYVaK-NkZcuR3kz7ilaDi2AKX4M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 