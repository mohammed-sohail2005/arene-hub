import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    throw new Error('Supabase credentials are missing or invalid. Please check your .env.local file. Have you added VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY?');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Diagnostic: Check if the Supabase domain is reachable from the browser
if (supabaseUrl) {
    fetch(supabaseUrl)
        .then(() => console.log('Successfully connected to Supabase URL'))
        .catch((err) => {
            console.error('Supabase Reachability Test Failed:', err);
            console.warn('Your browser/network is likely blocking https://' + new URL(supabaseUrl).hostname);
        });
}
