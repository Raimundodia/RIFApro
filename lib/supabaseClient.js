import { createClient } from '@supabase/supabase-js'

// Cole a sua URL do Supabase aqui entre as aspas (ex: 'https://xxxxxx.supabase.co')
const supabaseUrl = 'https://wkazkwsilsuwmredtwwd.supabase.com'

// Cole a sua Chave ANON (public) do Supabase aqui entre as aspas
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYXprd3NpbHN1d21yZWR0d3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MDA4NDgsImV4cCI6MjEwODQ3Njg0OH0.dY-lBxggoDss1B8jELL-stxfAlCojfjf0cGINsvztR4'

export const supabase = createClient(supabaseUrl, supabaseKey)
