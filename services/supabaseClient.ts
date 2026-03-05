
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// Replace these with your own Supabase project's URL and anon key!
// You can find these in your Supabase project settings under "API".
const supabaseUrl: string = 'https://klnnwcpkelhvesiyxznc.supabase.co'; // e.g., 'https://xyz.supabase.co'
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbm53Y3BrZWxodmVzaXl4em5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzcyNDIsImV4cCI6MjA3NzgxMzI0Mn0.r87aBMukFIzMOblk7uhmQb2WIzV_KGfFE3-yOMqjgLQ'; // e.g., 'eyABC...'

let supabase: SupabaseClient | null = null;

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
    // Simplified the warning to avoid potential parsing errors with file paths.
    console.warn('Supabase is not configured. Please add your project URL and key to this file. Database features will be disabled.');
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (error) {
        console.error("Error creating Supabase client:", error);
    }
}

export { supabase };