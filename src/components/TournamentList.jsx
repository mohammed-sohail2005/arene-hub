import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

const runAutoCleanup = async (tournaments) => {
    const now = new Date();
    const oldHostCodes = new Set();
    
    // Group all tournaments by host_code
    const groups = {};
    tournaments.forEach(t => {
        if (!t.host_code) return; 
        if (!groups[t.host_code]) groups[t.host_code] = [];
        groups[t.host_code].push(t);
    });

    Object.keys(groups).forEach(code => {
        const matches = groups[code];
        let allMatchesOld = true;
        
        for (const match of matches) {
            if (!match.date || !match.start_time) {
                allMatchesOld = false;
                break;
            }
            try {
                const [hours, minutes] = match.start_time.split(':');
                const matchDate = new Date(match.date);
                matchDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                const diffHours = (now - matchDate) / (1000 * 60 * 60);
                if (diffHours < 48) {
                    allMatchesOld = false;
                    break;
                }
            } catch {
                allMatchesOld = false;
                break;
            }
        }
        
        if (allMatchesOld && matches.length > 0) {
            oldHostCodes.add(code);
        }
    });

    for (const code of oldHostCodes) {
        try {
            const { data: regs } = await supabase
                .from('registrations')
                .select('payment_screenshot_url')
                .eq('host_code', code);

            if (regs && regs.length > 0) {
                const screenshots = regs
                    .filter(r => r.payment_screenshot_url)
                    .map(r => {
                        const parts = r.payment_screenshot_url.split('/');
                        return parts[parts.length - 1];
                    });
                
                if (screenshots.length > 0) {
                    await supabase.storage.from('tournaments').remove(screenshots);
                }
            }

            // Archive the tournament to preserve history/UPI ID for Host Integrity
            await supabase.from('tournaments')
                .update({ host_code: `archived_${code}`, status: 'Completed' })
                .eq('host_code', code);
                
            // Delete registrations
            await supabase.from('registrations').delete().eq('host_code', code);

        } catch (err) {
            console.error(`[Auto Cleanup] Error for ${code}:`, err);
        }
    }
};

const TournamentList = ({ onDetailsClick, onHostManageClick }) => {
    const toast = useToast();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [hostCode, setHostCode] = useState('');
    const [foundTournament, setFoundTournament] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchTournaments();

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tournaments' },
                () => fetchTournaments()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleHostSearch = async () => {
        if (hostCode.length !== 6) {
            toast.warning('Please enter a valid 6-digit code.');
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('host_code', hostCode)
                .not('host_code', 'like', 'pending_%');

            if (error) throw error;

            if (data && data.length > 0) {
                const first = data[0];
                const baseName = first.tournament_name.replace(/ - Match \d+$/, '');

                // Determine if the whole tournament is finished (all matches expired)
                const isFinished = data.every(m => isExpired(m));

                const combined = {
                    ...first,
                    tournament_name: baseName,
                    match_count: data.length,
                    matches: data,
                    status: isFinished ? 'Completed' : 'Active'
                };
                setFoundTournament(combined);
            } else {
                toast.error('No tournament found with this host code.');
                setFoundTournament(null);
            }
        } catch (err) {
            console.error('Host search error:', err);
            const found = tournaments.find(t => t.host_code === hostCode);
            if (found) {
                setFoundTournament(found);
            } else {
                toast.error('No tournament found with this host code.');
                setFoundTournament(null);
            }
        } finally {
            setIsSearching(false);
        }
    };

    const isExpired = (t) => {
        if (!t.date || !t.start_time) return false;
        try {
            const [hours, minutes] = t.start_time.split(':');
            const matchDateTime = new Date(t.date);
            matchDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            matchDateTime.setHours(matchDateTime.getHours() + 1);
            return matchDateTime < new Date();
        } catch (e) {
            return false;
        }
    };

    // Group tournaments by host_code into single entries
    const groupByHostCode = (data) => {
        const groups = {};
        data.forEach(t => {
            const key = t.host_code || t.id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        return Object.values(groups).map(matches => {
            matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
            const first = matches[0];
            const baseName = first.tournament_name.replace(/ - Match \d+$/, '');
            const maps = [...new Set(matches.map(m => m.map).filter(Boolean))];

            return {
                ...first,
                tournament_name: baseName,
                match_count: matches.length,
                matches: matches,
                maps: maps,
                first_start_time: matches[0]?.start_time,
                last_start_time: matches[matches.length - 1]?.start_time,
            };
        });
    };

    const fetchTournaments = async () => {
        try {
            setFetchError(null);
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .not('host_code', 'like', 'pending_%')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Trigger silent cleanup in background
            if (data && data.length > 0) {
                runAutoCleanup(data);
            }

            // Group ALL tournaments first, then filter out groups where ALL matches are expired.
            // This preserves the full match count for multi-match tournaments.
            const grouped = groupByHostCode(data || []);
            const liveGrouped = grouped.filter(group => {
                // Keep the group if at least one match is still live
                return group.matches.some(m => !isExpired(m));
            });

            // Fetch registration counts for each grouped tournament
            const withCounts = await Promise.all(liveGrouped.map(async (t) => {
                try {
                    const { count } = await supabase
                        .from('registrations')
                        .select('*', { count: 'exact', head: true })
                        .eq('host_code', t.host_code);
                    const maxSquads = t.max_teams || Math.floor((t.max_players || 100) / 4);
                    return { ...t, registered_squads: count || 0, max_squads: maxSquads };
                } catch {
                    return { ...t, registered_squads: 0, max_squads: t.max_teams || Math.floor((t.max_players || 100) / 4) };
                }
            }));

            setTournaments(withCounts);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            setTournaments([]);
            setFetchError(error.message || 'Failed to connect.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '15px', color: 'var(--primary)' }}></i>
            <p>Loading Live Tournaments...</p>
        </div>;
    }

    if (fetchError) {
        return (
            <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px', margin: '40px auto', maxWidth: '800px', border: '1px solid #ff4d4d' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#ff4d4d', marginBottom: '20px' }}></i>
                <h3 style={{ color: '#ff4d4d' }}>Connection Error</h3>
                <p style={{ color: 'var(--text-dim)', marginBottom: '10px' }}>{fetchError}</p>
                <button className="btn btn-primary" onClick={fetchTournaments}>TRY AGAIN</button>
            </div>
        );
    }

    return (
        <section id="tournaments" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Host Management Search */}
            <div className="glass" style={{ marginBottom: '60px', padding: '30px', borderRadius: '20px', border: '1px solid var(--primary-glow)' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>HOST <span style={{ color: 'var(--primary)' }}>DASHBOARD</span></h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Enter your 6-digit code to track registrations</p>
                </div>
                <div className="wrap-mobile" style={{ gap: '15px', maxWidth: '500px', margin: '0 auto' }}>
                    <input
                        type="text"
                        placeholder="6-Digit Host Code"
                        value={hostCode}
                        onChange={(e) => setHostCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleHostSearch()}
                        className="form-control"
                        maxLength={6}
                        style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', flex: 1, minWidth: '150px' }}
                    />
                    <button 
                        className="btn btn-primary" 
                        onClick={handleHostSearch} 
                        disabled={isSearching}
                        style={{ padding: '0 30px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {isSearching ? <i className="fas fa-spinner fa-spin"></i> : 'SEARCH'}
                    </button>
                </div>

                {foundTournament && (
                    <div className="glass" style={{ marginTop: '30px', padding: '24px', border: '1px solid var(--primary)', animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>{foundTournament.tournament_name}</h4>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                    {foundTournament.match_count} Match{foundTournament.match_count > 1 ? 'es' : ''} • Status: <span style={{ color: foundTournament.status === 'Live' ? '#00ff9c' : 'var(--text-dim)' }}>{foundTournament.status}</span>
                                </p>
                            </div>
                            <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.75rem' }} onClick={() => onHostManageClick(hostCode, foundTournament)}>
                                <i className="fas fa-eye" style={{ marginRight: '6px' }}></i>MANAGE
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>LIVE <span style={{ color: 'var(--primary)' }}>TOURNAMENTS</span></h2>
                <p style={{ color: 'var(--text-dim)' }}>Join the battle and compete for glory.</p>
            </div>

            {tournaments.length === 0 ? (
                <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
                    <i className="fas fa-trophy" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '20px' }}></i>
                    <h3>No Active Tournaments</h3>
                    <p style={{ color: 'var(--text-dim)' }}>Be the first to host a tournament!</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {(showAll ? tournaments : tournaments.slice(0, 3)).map((t) => (
                            <div key={t.host_code || t.id} className="tournament-card glass hover-glow" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', transition: '0.3s' }}>
                                {/* Card Image */}
                                <div style={{ height: '180px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                                    {t.photo_url ? (
                                        <img src={t.photo_url} alt={t.tournament_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-glow)', opacity: 0.1 }}>
                                            <i className="fas fa-gamepad" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                                        </div>
                                    )}
                                    {/* Game badge */}
                                    <div className="badge" style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--primary)', color: '#000', fontWeight: 800 }}>
                                        {t.game?.toUpperCase()}
                                    </div>
                                    {/* Match count badge */}
                                    {t.match_count > 1 && (
                                        <div style={{
                                            position: 'absolute', top: '15px', left: '15px',
                                            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                                            padding: '5px 12px', borderRadius: '8px',
                                            fontSize: '0.7rem', fontWeight: 800,
                                            color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)',
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                        }}>
                                            <i className="fas fa-layer-group"></i> {t.match_count} MATCHES
                                        </div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '24px' }}>
                                    <div className="wrap-mobile" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>{t.tournament_name}</h3>
                                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>₹{t.prize_pool}</div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '2px' }}>DATE</div>
                                            <i className="far fa-calendar-alt" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>{t.date || 'TBD'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '2px' }}>TIME</div>
                                            <i className="far fa-clock" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                                            {t.match_count > 1 ? `${t.first_start_time || 'TBD'} - ${t.last_start_time || 'TBD'}` : (t.start_time || 'TBD')}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '2px' }}>MAPS</div>
                                            <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                                            {t.maps?.length > 1 ? t.maps.join(', ') : (t.map || 'TBD')}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '2px' }}>FORMAT</div>
                                            <i className="fas fa-users" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>{t.format || 'SQUAD'}
                                        </div>
                                        <div style={{ color: t.registered_squads >= t.max_squads ? '#ff4d4d' : 'var(--text-dim)', gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: '0.65rem', color: t.registered_squads >= t.max_squads ? '#ff4d4d' : 'var(--primary)', fontWeight: 700, marginBottom: '2px' }}>AVAILABILITY</div>
                                            <i className="fas fa-user-friends" style={{ marginRight: '8px', color: t.registered_squads >= t.max_squads ? '#ff4d4d' : 'var(--primary)' }}></i>
                                            {t.registered_squads}/{t.max_squads} Squads Joined
                                        </div>
                                    </div>

                                    {/* Entry Fee */}
                                    {t.entry_fee > 0 && (
                                        <div style={{
                                            background: 'rgba(0,255,156,0.05)', padding: '8px 12px',
                                            borderRadius: '8px', border: '1px solid rgba(0,255,156,0.15)',
                                            marginBottom: '16px', fontSize: '0.75rem', color: 'var(--text-dim)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <span>Entry Fee</span>
                                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{t.entry_fee}</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                        {t.registered_squads >= t.max_squads ? (
                                            <div style={{ flex: 1, padding: '12px', fontWeight: 800, textAlign: 'center', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', color: '#ff4d4d', fontSize: '0.9rem' }}>
                                                <i className="fas fa-ban" style={{ marginRight: '8px' }}></i>TOURNAMENT FULL
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-primary"
                                                style={{ flex: 1, padding: '12px', fontWeight: 800 }}
                                                onClick={() => onDetailsClick(t)}
                                            >
                                                DETAILS
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                        Hosted by <span style={{ color: '#fff' }}>{t.owner_name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show More / Less Button */}
                    {tournaments.length > 3 && (
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="btn btn-outline"
                                style={{
                                    padding: '14px 40px', fontSize: '0.85rem',
                                    borderColor: 'var(--primary)', color: 'var(--primary)',
                                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                                }}
                            >
                                {showAll ? (
                                    <><i className="fas fa-chevron-up"></i> SHOW LESS</>
                                ) : (
                                    <><i className="fas fa-chevron-down"></i> VIEW ALL {tournaments.length} TOURNAMENTS</>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default TournamentList;
