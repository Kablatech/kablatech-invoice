import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fcazmadjmlupckionxsl.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXptYWRqbWx1cGNraW9ueHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTU5NDUsImV4cCI6MjA5ODMzMTk0NX0.f_w4u3v36tJyJpnyVG9wqGu5DaPetTKhWTEKyVGLVc4'

export const supabase = createClient(supabaseUrl, supabaseKey)
