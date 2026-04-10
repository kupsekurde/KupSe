// Dane do połączenia z Twoim Supabase (znajdziesz je w Settings -> API)
const SUPABASE_URL = 'TWOJ_URL_Z_SUPABASE';
const SUPABASE_KEY = 'TWOJ_ANON_KEY_Z_SUPABASE';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("KupSe działa! Połączono z systemem.");
