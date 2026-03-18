import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
        return acc;
    }, {});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const hostCode = `test_${Math.floor(Math.random() * 100000)}`;
    const tournamentId = '00000000-0000-0000-0000-000000000000'; // Temporary ID for test

    console.log(`Starting Verification for Host Code: ${hostCode}`);

    try {
        // 1. Setup Tournament Matches
        console.log('1. Setting up staged tournament matches...');
        const { data: matches, error: matchError } = await supabase
            .from('tournaments')
            .insert([
                { 
                    host_code: hostCode, 
                    tournament_name: 'Test - Qualifier 1', 
                    stage: 'Qualifier 1', 
                    is_staged: true,
                    max_teams: 5,
                    room_id: 'Q1_ROOM',
                    room_password: 'Q1_PASS',
                    status: 'Live',
                    game: 'BGMI',
                    upi_id: 'test@upi',
                    owner_name: 'Test Host',
                    entry_fee: 0,
                    prize_pool: 1000
                },
                { 
                    host_code: hostCode, 
                    tournament_name: 'Test - Qualifier 2', 
                    stage: 'Qualifier 2', 
                    is_staged: true,
                    max_teams: 5,
                    room_id: 'Q2_ROOM',
                    room_password: 'Q2_PASS',
                    status: 'Live',
                    game: 'BGMI',
                    upi_id: 'test@upi',
                    owner_name: 'Test Host',
                    entry_fee: 0,
                    prize_pool: 1000
                },
                { 
                    host_code: hostCode, 
                    tournament_name: 'Test - Semi-Final', 
                    stage: 'Semi-Final', 
                    is_staged: true,
                    max_teams: 5,
                    room_id: 'SEMI_ROOM',
                    room_password: 'SEMI_PASS',
                    status: 'Live',
                    game: 'BGMI',
                    upi_id: 'test@upi',
                    owner_name: 'Test Host',
                    entry_fee: 0,
                    prize_pool: 1000
                }
            ])
            .select();

        if (matchError) throw matchError;

        // 2. Register Squads and Verify Slot Assignment
        console.log('2. Registering squads and verifying slots...');
        const squads = [
            { name: 'Squad A', slot: 1 },
            { name: 'Squad B', slot: 2 },
            { name: 'Squad C', slot: 6 }, // Should be in Qualifier 2
        ];

        for (const s of squads) {
            const { data, error } = await supabase
                .from('registrations')
                .insert({
                    host_code: hostCode,
                    squad_name: s.name,
                    team_code: `CODE_${s.name.replace(' ', '')}`,
                    slot_number: s.slot,
                    players: JSON.stringify([{name: 'Player 1', id: '1234567890'}])
                })
                .select()
                .single();
            
            if (error) throw error;
            console.log(`Registered ${s.name} with slot ${data.slot_number}`);
            s.id = data.id;
        }

        // 3. Verify Visibility Logic (Simulation of TeamPortalPage logic)
        console.log('3. Verifying room visibility logic...');
        
        const checkVisibility = (squad, match) => {
            const maxTeams = match.max_teams || 25;
            const squadGroup = Math.ceil(squad.slot / maxTeams);
            const matchGroup = parseInt(match.stage.replace('Qualifier ', ''));
            
            if (match.stage.includes('Qualifier')) {
                return squadGroup === matchGroup;
            }
            if (match.stage.includes('Semi-Final')) {
                return squad.qualified === 'Semi-Final'; // Simplified for test
            }
            return false;
        };

        const squadA = squads[0];
        const squadC = squads[2];

        console.log(`Squad A (Slot 1) visibility for Qualifier 1: ${checkVisibility(squadA, matches[0])} (expected: true)`);
        console.log(`Squad A (Slot 1) visibility for Qualifier 2: ${checkVisibility(squadA, matches[1])} (expected: false)`);
        console.log(`Squad C (Slot 6) visibility for Qualifier 1: ${checkVisibility(squadC, matches[0])} (expected: false)`);
        console.log(`Squad C (Slot 6) visibility for Qualifier 2: ${checkVisibility(squadC, matches[1])} (expected: true)`);

        if (!checkVisibility(squadA, matches[0]) || checkVisibility(squadA, matches[1])) {
            throw new Error('Visibility logic failure for Qualifier groups!');
        }

        // 4. Test Qualification & Messaging
        console.log('4. Testing Qualification & Messaging...');
        const { error: qualError } = await supabase
            .from('registrations')
            .update({ 
                qualified_upto: 'Semi-Final',
                selection_message: 'Congrats! You are selected for Semi-Finals.',
                status: 'Active'
            })
            .eq('id', squadA.id);

        if (qualError) throw qualError;

        const { data: squadAUpdated } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', squadA.id)
            .single();

        console.log(`Squad A qualified_upto: ${squadAUpdated.qualified_upto}`);
        console.log(`Squad A selection_message: ${squadAUpdated.selection_message}`);

        if (squadAUpdated.qualified_upto !== 'Semi-Final') throw new Error('Failed to update qualification!');

        // 5. Test Disqualification & Lockout
        console.log('5. Testing Disqualification & Lockout...');
        const { error: disqError } = await supabase
            .from('registrations')
            .update({ 
                status: 'disqualified',
                selection_message: 'Not selected.'
            })
            .eq('id', squadC.id);

        if (disqError) throw disqError;

        const { data: squadCUpdated } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', squadC.id)
            .single();

        console.log(`Squad C status: ${squadCUpdated.status} (expected: disqualified)`);

        if (squadCUpdated.status !== 'disqualified') throw new Error('Failed to disqualify squad!');

        console.log('Verification Successful! All logic passed.');

    } catch (err) {
        console.error('Verification FAILED:', err);
    } finally {
        // Cleanup
        console.log('Cleaning up test data...');
        await supabase.from('registrations').delete().eq('host_code', hostCode);
        await supabase.from('tournaments').delete().eq('host_code', hostCode);
        console.log('Cleanup complete.');
    }
}

run();
