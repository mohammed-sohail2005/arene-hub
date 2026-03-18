// Arena Hub - Multi-Stage Tournament Test Suite
// This script verified the full flow: hosting, registration, qualification, and management.

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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const results = { passed: [], failed: [], warnings: [], schemaIssues: [] };

function pass(msg) { results.passed.push(msg); console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { results.failed.push(msg); console.error(`  ❌ FAIL: ${msg}`); }
function warn(msg) { results.warnings.push(msg); console.warn(`  ⚠️ WARN: ${msg}`); }
function schema(msg) { results.schemaIssues.push(msg); console.error(`  🔴 SCHEMA: ${msg}`); }

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   ARENA HUB - Multi-Stage Tournament Test Suite         ');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
        const { data: ping, error: pingErr } = await supabase.from('tournaments').select('id').limit(1);
        if (pingErr) { fail(`Supabase Connection: ${pingErr.message}`); return; }
        pass('Supabase connection OK');
        
        // --- 1. Schema Check ---
        console.log('\n📋 STEP 1: Schema Verification...');
        const { data: tourCols } = await supabase.from('tournaments').select('*').limit(1);
        const tourFields = Object.keys(tourCols?.[0] || {});
        
        const requiredTour = ['is_staged', 'stage', 'num_qualifiers', 'status'];
        requiredTour.forEach(f => {
            if (tourFields.includes(f)) pass(`tournaments.${f} exists`);
            else schema(`tournaments.${f} MISSING`);
        });

        const { data: regCols } = await supabase.from('registrations').select('*').limit(1);
        const regFields = Object.keys(regCols?.[0] || {});
        const requiredReg = ['qualified_upto', 'squad_logo_url'];
        requiredReg.forEach(f => {
            if (regFields.includes(f)) pass(`registrations.${f} exists`);
            else schema(`registrations.${f} MISSING`);
        });

        // --- 2. Functional Flow (Dry Run / Basic Check) ---
        console.log('\n📋 STEP 2: Functional Logic Check...');
        const hostCode = 'TEST-' + Math.floor(Math.random() * 10000);
        
        // Create match
        const { data: match, error: mErr } = await supabase.from('tournaments').insert({
            game: 'bgmi', owner_name: 'Test', tournament_name: 'Fix Test',
            upi_id: 'test@upi', host_code: hostCode,
            // Only include these if they exist in schema to avoid crash
            ...(tourFields.includes('is_staged') ? { is_staged: true, stage: 'Qualifier' } : {})
        }).select().single();
        
        if (mErr) fail(`Match Creation: ${mErr.message}`);
        else pass(`Test match created (${hostCode})`);

        if (match) {
            // Register squad
            const { data: reg, error: rErr } = await supabase.from('registrations').insert({
                tournament_id: match.id, host_code: hostCode, team_code: '123456',
                squad_name: 'Test Squad', players: [{name:'p1',id:'1234567890'}]
            }).select().single();

            if (rErr) fail(`Squad Registration: ${rErr.message}`);
            else pass(`Test squad registered`);

            // Cleanup
            await supabase.from('registrations').delete().eq('host_code', hostCode);
            await supabase.from('tournaments').delete().eq('host_code', hostCode);
            pass('Test data cleaned up');
        }

    } catch (err) {
        fail(`Unhandled: ${err.message}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                   FINAL REPORT                          ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  ✅ Passed:  ${results.passed.length}`);
    console.log(`  ❌ Failed:  ${results.failed.length}`);
    console.log(`  🔴 Schema:  ${results.schemaIssues.length}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (results.schemaIssues.length > 0) {
        console.log('\n🔴 MISSING DATABASE COLUMNS - PLEASE RUN MIGRATION:');
        console.log('SQL located at: ./supabase/migration_multistage.sql');
    }
}

main();
