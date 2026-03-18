// Multi-stage Grouping Slot Tracking Test
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env.local parsing
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSlots() {
    console.log("Checking if 'slot_number' exists...");
    const { data: cols } = await supabase.from('registrations').select('*').limit(1);
    const fields = Object.keys(cols?.[0] || {});
    
    if (!fields.includes('slot_number')) {
        console.error("❌ FAIL: 'slot_number' column missing from registrations table.");
        console.log("Please run: ALTER TABLE registrations ADD COLUMN IF NOT EXISTS slot_number INTEGER;");
        return;
    }
    console.log("✅ 'slot_number' column exists.");

    const hostCode = 'SLOTTEST-' + Math.floor(Math.random() * 10000);
    
    console.log(`Creating test tournament (${hostCode})...`);
    const { data: tour } = await supabase.from('tournaments').insert({
        game: 'bgmi', owner_name: 'Test', tournament_name: 'Slot Test',
        upi_id: 'test@upi', host_code: hostCode, max_teams: 25
    }).select().single();

    if (!tour) { console.error("Failed to create tour"); return; }

    console.log("Registering 2 squads and checking slots...");
    
    for (let i = 1; i <= 2; i++) {
        // Fetch count like RegisterModal does
        const { count } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('host_code', hostCode);
        const slot = (count || 0) + 1;
        
        await supabase.from('registrations').insert({
            tournament_id: tour.id, host_code: hostCode, team_code: `T${i}`,
            squad_name: `Squad ${i}`, players: [{name:'p',id:'123456789'+i}],
            slot_number: slot
        });
        console.log(`Squad ${i} registered with slot: ${slot}`);
    }

    // Verify
    const { data: res } = await supabase.from('registrations').select('slot_number').eq('host_code', hostCode).order('slot_number');
    if (res?.[0]?.slot_number === 1 && res?.[1]?.slot_number === 2) {
        console.log("✅ PASS: Slot numbers assigned correctly (1 and 2).");
    } else {
        console.error("❌ FAIL: Slot numbers incorrect.", res);
    }

    // Cleanup
    await supabase.from('registrations').delete().eq('host_code', hostCode);
    await supabase.from('tournaments').delete().eq('host_code', hostCode);
    console.log("Cleanup complete.");
}

testSlots();
