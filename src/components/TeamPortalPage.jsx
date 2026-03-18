import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import PointsLeaderboard from './PointsLeaderboard';

const TeamPortalPage = ({ onBack }) => {
    const toast = useToast();
    const [teamCode, setTeamCode] = useState('');
    const [team, setTeam] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [rankScreenshots, setRankScreenshots] = useState({});
    const [uploadingRank, setUploadingRank] = useState(null);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const handleRankUpload = async (matchId, event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingRank(matchId);
        try {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file for the rank screenshot.');
            }

            // 1. Upload new screenshot to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${team.id}-${matchId}-${Math.random()}.${fileExt}`;
            const filePath = `ranks/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tournaments') // reusing the existing tournament bucket
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tournaments')
                .getPublicUrl(filePath);

            // 2. Insert or Update into squad_ranks table
            const { error: dbError } = await supabase
                .from('squad_ranks')
                .upsert(
                    { registration_id: team.id, match_id: matchId, screenshot_url: publicUrl },
                    { onConflict: 'registration_id,match_id' }
                );

            if (dbError) throw dbError;

            // 3. Update local state
            setRankScreenshots(prev => ({ ...prev, [matchId]: publicUrl }));
            toast.success('Result uploaded successfully! The host can now view your rank.');

        } catch (err) {
            console.error('Error uploading rank:', err);
            toast.error(err.message || 'Failed to upload rank. Please try again.');
        } finally {
            setUploadingRank(null);
        }
    };

    const handleSearch = async () => {
        if (teamCode.length !== 6) {
            toast.warning('Please enter a valid 6-digit team code.');
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            // Fetch team registration
            const { data: teamData, error: teamErr } = await supabase
                .from('registrations')
                .select('*')
                .eq('team_code', teamCode)
                .single();

            if (teamErr || !teamData) {
                setTeam(null);
                setMatches([]);
                setRankScreenshots({});
                setLoading(false);
                return;
            }

            // Check if team was kicked by host (payment issue)
            if (teamData.status === 'kicked') {
                setTeam({ ...teamData, kicked: true });
                setMatches([]);
                setLoading(false);
                return;
            }

            // Check if team was disqualified (not selected for next stage)
            if (teamData.status === 'disqualified') {
                setTeam({ ...teamData, disqualified: true });
                setMatches([]);
                setLoading(false);
                return;
            }

            // Fetch all registrations for this host to find the slot number
            const { data: allRegs } = await supabase
                .from('registrations')
                .select('id, team_code')
                .eq('host_code', teamData.host_code)
                .order('created_at', { ascending: true });

            let slotNumber = 'TBD';
            if (allRegs) {
                const idx = allRegs.findIndex(r => r.team_code === teamCode);
                if (idx !== -1) slotNumber = idx + 1;
            }

            setTeam({ ...teamData, slot_number: slotNumber });

            // Fetch matches for this tournament's host code
            const { data: matchData, error: matchErr } = await supabase
                .from('tournaments')
                .select('*')
                .eq('host_code', teamData.host_code)
                .order('start_time', { ascending: true });

            if (!matchErr) {
                setMatches(matchData || []);
            }

            // Fetch uploaded rank screenshots for this team
            const { data: rankData, error: rankErr } = await supabase
                .from('squad_ranks')
                .select('*')
                .eq('registration_id', teamData.id);

            if (!rankErr && rankData) {
                const ranksMap = {};
                rankData.forEach(r => {
                    ranksMap[r.match_id] = r.screenshot_url;
                });
                setRankScreenshots(ranksMap);
            }

        } catch (err) {
            console.error('Error fetching team data:', err);
            setTeam(null);
        } finally {
            setLoading(false);
        }
    };

    // Supabase Realtime: listen for room details updates from host (per match)
    useEffect(() => {
        if (!team || !team.host_code || team.kicked) return;

        const channel = supabase
            .channel(`room-updates-${team.host_code}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tournaments',
                    filter: `host_code=eq.${team.host_code}`,
                },
                (payload) => {
                    const updated = payload.new;

                    setMatches(prev => {
                        const oldMatch = prev.find(m => m.id === updated.id);
                        if (oldMatch) {
                            // Detect room details being added
                            if (updated.room_id && updated.room_password && (!oldMatch.room_id || !oldMatch.room_password)) {
                                const title = `🎮 Room Details for "${updated.tournament_name}"!`;
                                const body = `Room ID & Password are now available.\nMap: ${updated.map || 'N/A'}\nCheck your match card below!`;
                                toast.success(`${title}\n\n${body}`);

                                if ('Notification' in window && Notification.permission === 'granted') {
                                    new Notification(title, { body, icon: '/logo.jpg', requireInteraction: true });
                                }
                            }

                            // Detect timing changes (only if it actually changed)
                            const timeChanged = (updated.room_time !== oldMatch.room_time) || (updated.start_time !== oldMatch.start_time);
                            if (timeChanged) {
                                let title = `⏰ Schedule Update for "${updated.tournament_name}"!`;
                                let body = '';
                                if (updated.room_time !== oldMatch.room_time) body += `Room Opens: ${updated.room_time || 'TBD'}\n`;
                                if (updated.start_time !== oldMatch.start_time) body += `Match Starts: ${updated.start_time || 'TBD'}\n`;

                                toast.warning(`${title}\n\n${body}`);

                                if ('Notification' in window && Notification.permission === 'granted') {
                                    new Notification(title, { body: body.trim(), icon: '/logo.jpg' });
                                }
                            }
                        }

                        return prev.map(m => m.id === updated.id ? { ...m, ...updated } : m);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [team, toast]);

    // Notify player when the same host creates a new tournament
    useEffect(() => {
        if (!team || !team.host_code || team.kicked) return;

        // First, look up the host's upi_id from the current matches
        let hostUpiId = null;
        let hostName = null;
        if (matches.length > 0) {
            hostUpiId = matches[0]?.upi_id;
            hostName = matches[0]?.owner_name || 'Your Host';
        }
        if (!hostUpiId) return;

        const newTournamentChannel = supabase
            .channel(`new-tournament-by-host-${hostUpiId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tournaments',
                },
                (payload) => {
                    const newTournament = payload.new;
                    if (newTournament.upi_id === hostUpiId && newTournament.host_code !== team.host_code) {
                        const name = newTournament.tournament_name || 'a new tournament';
                        const title = `🔔 ${hostName} created a new tournament!`;
                        const body = `"${name}"\n\nCheck it out on the home page!`;
                        
                        toast.success(`${title}\n\n${body}`, 8000);

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(title, { body, icon: '/logo.jpg' });
                        }
                    }
                }
            )
            .subscribe();

        // Listen for updates to this specific team's registration (qualification/disqualification)
        const registrationChannel = supabase
            .channel(`registration-updates-${team.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'registrations',
                    filter: `id=eq.${team.id}`,
                },
                (payload) => {
                    const updated = payload.new;
                    
                    setTeam(prev => {
                        // Detect selection message change
                        if (updated.selection_message && updated.selection_message !== prev.selection_message) {
                            const isDisqualified = updated.status === 'disqualified';
                            const title = isDisqualified ? '❌ Important Update' : '🎉 Congratulations!';
                            toast.success(`${title}\n\n${updated.selection_message}`, { duration: 10000 });
                            
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(title, { body: updated.selection_message, icon: '/logo.jpg' });
                            }
                        }

                        return { 
                            ...prev, 
                            ...updated, 
                            disqualified: updated.status === 'disqualified',
                            kicked: updated.status === 'kicked'
                        };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(newTournamentChannel);
            supabase.removeChannel(registrationChannel);
        };
    }, [team, matches, toast]);

    // Supabase Realtime: listen for leaderboard updates
    useEffect(() => {
        if (!team || !team.host_code) return;

        const rankChannel = supabase
            .channel(`rank-updates-${team.host_code}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'squad_ranks',
                },
                () => {
                    setRefreshLeaderboard(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(rankChannel);
        };
    }, [team]);

    // Room time approaching alert for players
    useEffect(() => {
        if (!matches.length || !team || team.kicked) return;
        const notified = new Set();

        const checkRoomTimes = () => {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const todayStr = now.toISOString().split('T')[0];

            matches.forEach((match, idx) => {
                if (!match.room_time || notified.has(match.id)) return;

                // Only check and alert if the tournament is actually today
                if (match.date) {
                    const matchDate = typeof match.date === 'string' ? match.date.split('T')[0] : match.date;
                    if (matchDate !== todayStr) return;
                }

                const parts = match.room_time.split(':');
                const roomMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                const diff = roomMins - currentMins;

                if (diff <= 5 && diff >= 0) {
                    notified.add(match.id);
                    const title = `⏰ Match ${idx + 1} room opens in ${diff} min!`;
                    const body = `${match.tournament_name}\nMap: ${match.map || 'N/A'}\n\nGet ready to join!`;
                    toast.warning(`${title}\n\n${body}`);
                    
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(title, { body, icon: '/logo.jpg' });
                    }
                } else if (diff < 0 && diff >= -5 && !match.room_id) {
                    notified.add(match.id);
                    const title = `🚨 Match ${idx + 1} room time has passed!`;
                    const body = `${match.tournament_name}\n\nWaiting for host to upload Room ID...`;
                    toast.warning(`${title}\n\n${body}`);

                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(title, { body, icon: '/logo.jpg' });
                    }
                }
            });
        };

        checkRoomTimes();
        const interval = setInterval(checkRoomTimes, 30000);
        return () => clearInterval(interval);
    }, [matches, team, toast]);

    // Entry screen
    if (!searched || (!team && !loading)) {
        return (
            <div className="page-container" style={{ maxWidth: '600px' }}>
                <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
                </button>

                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>TEAM <span style={{ color: 'var(--primary)' }}>PORTAL</span></h1>
                    <p style={{ color: 'var(--text-dim)' }}>Enter your 6-digit team code to view match details</p>
                </div>

                <div className="glass" style={{ padding: '40px', borderRadius: '24px', border: '1px solid var(--primary)' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Team Code</label>
                        <input
                            className="form-control"
                            placeholder="Enter 6-digit code"
                            value={teamCode}
                            onChange={e => setTeamCode(e.target.value)}
                            maxLength={6}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '6px', padding: '16px' }}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 800 }}
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '10px' }}></i> SEARCHING...</>
                        ) : (
                            <><i className="fas fa-eye" style={{ marginRight: '10px' }}></i> VIEW DETAILS</>
                        )}
                    </button>

                    {searched && !team && !loading && (
                        <div style={{ marginTop: '20px', textAlign: 'center', color: '#ff4d4d', fontSize: '0.85rem' }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
                            No team found with this code. Please check and try again.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '15px', color: 'var(--primary)' }}></i>
                <p>Loading your team details...</p>
            </div>
        );
    }

    // Kicked screen
    if (team?.kicked) {
        return (
            <div className="page-container" style={{ maxWidth: '600px' }}>
                <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
                </button>

                <div className="glass" style={{
                    padding: '50px 30px', borderRadius: '24px', textAlign: 'center',
                    border: '1px solid #ff4d4d',
                    background: 'linear-gradient(135deg, rgba(255,77,77,0.08), rgba(0,0,0,0))',
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(255,77,77,0.15)', border: '2px solid #ff4d4d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <i className="fas fa-ban" style={{ fontSize: '2.5rem', color: '#ff4d4d' }}></i>
                    </div>

                    <h2 style={{ color: '#ff4d4d', marginBottom: '12px', fontSize: '1.5rem' }}>
                        REGISTRATION <span style={{ color: '#fff' }}>REMOVED</span>
                    </h2>

                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '8px' }}>
                        Your squad <strong style={{ color: '#ff4d4d' }}>"{team.squad_name}"</strong> has been removed from this tournament by the host due to invalid payment proof.
                    </p>

                    <div style={{
                        background: 'rgba(255,77,77,0.06)', padding: '16px 20px', borderRadius: '12px',
                        border: '1px solid rgba(255,77,77,0.2)', marginTop: '20px', marginBottom: '24px',
                    }}>
                        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            <i className="fas fa-info-circle" style={{ color: '#ff4d4d', marginRight: '6px' }}></i>
                            If you believe this is a mistake, please contact the tournament host and re-register with valid payment proof.
                        </p>
                    </div>

                    <button
                        onClick={onBack}
                        className="btn btn-outline"
                        style={{ padding: '14px 40px', borderColor: '#ff4d4d', color: '#ff4d4d' }}
                    >
                        <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> GO BACK
                    </button>
                </div>
            </div>
        );
    }

    // Disqualified screen
    if (team?.disqualified) {
        return (
            <div className="page-container" style={{ maxWidth: '600px' }}>
                <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
                </button>

                <div className="glass" style={{
                    padding: '50px 30px', borderRadius: '24px', textAlign: 'center',
                    border: '1px solid #ff4d4d',
                    background: 'linear-gradient(135deg, rgba(255,77,77,0.08), rgba(0,0,0,0))',
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(255,77,77,0.15)', border: '2px solid #ff4d4d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <i className="fas fa-user-slash" style={{ fontSize: '2.2rem', color: '#ff4d4d' }}></i>
                    </div>

                    <h2 style={{ color: '#ff4d4d', marginBottom: '12px', fontSize: '1.5rem' }}>
                        NOT <span style={{ color: '#fff' }}>SELECTED</span>
                    </h2>

                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '24px' }}>
                        {team.selection_message || "We regret to inform you that your squad was not selected for the next stage. Better luck next time!"}
                    </p>

                    <div style={{
                        background: 'rgba(255,77,77,0.06)', padding: '16px 20px', borderRadius: '12px',
                        border: '1px solid rgba(255,77,77,0.2)', marginTop: '20px', marginBottom: '24px',
                    }}>
                        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            <i className="fas fa-lock" style={{ color: '#ff4d4d', marginRight: '6px' }}></i>
                            Your group access code has been disabled. You can no longer manage details for this tournament.
                        </p>
                    </div>

                    <button
                        onClick={onBack}
                        className="btn btn-outline"
                        style={{ padding: '14px 40px', borderColor: '#ff4d4d', color: '#ff4d4d' }}
                    >
                        <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> GO BACK
                    </button>
                </div>
            </div>
        );
    }

    // Team detail view
    return (
        <div className="page-container" style={{ maxWidth: '800px' }}>
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
            </button>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>TEAM <span style={{ color: 'var(--primary)' }}>PORTAL</span></h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    Team Code: <span style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '3px' }}>{teamCode}</span>
                </p>
            </div>

            {/* Team Info Card */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '30px', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: team.squad_logo_url ? 'transparent' : 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--primary)', overflow: 'hidden', flexShrink: 0
                    }}>
                        {team.squad_logo_url ? (
                            <img src={team.squad_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <i className="fas fa-users" style={{ color: '#000', fontSize: '1.5rem' }}></i>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.5rem' }}>{team.squad_name}</h3>
                            <span style={{ 
                                background: 'rgba(0, 255, 156, 0.15)', 
                                color: 'var(--primary)', 
                                padding: '4px 12px', 
                                borderRadius: '8px', 
                                fontSize: '0.75rem', 
                                fontWeight: 900,
                                border: '1px solid rgba(0, 255, 156, 0.3)'
                            }}>
                                SLOT ROOM: {team.slot_number || 'TBD'}
                            </span>
                        </div>
                    </div>
                </div>

                {team.selection_message && (
                    <div className="glass" style={{ 
                        padding: '16px', borderRadius: '12px', marginBottom: '24px', 
                        background: 'rgba(0, 255, 156, 0.05)', border: '1px solid rgba(0, 255, 156, 0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                            <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i> HOST ANNOUNCEMENT
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                            {team.selection_message}
                        </p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {(Array.isArray(team.players) ? team.players : JSON.parse(team.players || '[]')).map((p, i) => (
                        <div key={i} style={{ background: 'rgba(0,255,156,0.03)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,255,156,0.1)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ID: {p.id}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Match Room Details */}
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-key" style={{ color: 'var(--primary)' }}></i> Match Room Details
            </h2>

            {matches.length === 0 ? (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                    <i className="fas fa-clock" style={{ fontSize: '2rem', color: 'var(--border)', marginBottom: '12px' }}></i>
                    <p style={{ color: 'var(--text-dim)' }}>No match details available yet. Check back later!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {matches.map((match, idx) => {
                        const hasRoom = match.room_id && match.room_password;

                        // Calculate match timing status
                        const now = new Date();
                        const todayStr = now.toISOString().split('T')[0];
                        const matchDateStr = match.date ? (typeof match.date === 'string' ? match.date.split('T')[0] : match.date) : todayStr;
                        const isToday = matchDateStr === todayStr;
                        const isPastDate = matchDateStr < todayStr;

                        const currentMins = now.getHours() * 60 + now.getMinutes();
                        let roomMins = null, startMins = null, matchStatus = 'upcoming';

                        if (isPastDate) {
                            matchStatus = 'live';
                        } else if (isToday) {
                            if (match.room_time) {
                                const rp = match.room_time.split(':');
                                roomMins = parseInt(rp[0]) * 60 + parseInt(rp[1]);
                            }
                            if (match.start_time) {
                                const sp = match.start_time.split(':');
                                startMins = parseInt(sp[0]) * 60 + parseInt(sp[1]);
                            }

                            if (startMins !== null && currentMins >= startMins) {
                                matchStatus = 'live';
                            } else if (roomMins !== null && currentMins >= roomMins - 5) {
                                matchStatus = 'room-open';
                            }
                        }

                        const statusConfig = {
                            'live': { label: 'MATCH LIVE', color: '#00ff9c', icon: 'fas fa-play-circle', pulse: true },
                            'room-open': { label: 'ROOM OPENING', color: '#FFD700', icon: 'fas fa-door-open', pulse: true },
                            'upcoming': { label: 'UPCOMING', color: 'var(--text-dim)', icon: 'far fa-clock', pulse: false },
                        }[matchStatus];

                        const isStaged = match.is_staged;
                        const matchStage = match.stage || '';
                        
                        // Qualification logic
                        let isQualified = true;
                        let teamQualifierGroup = null;

                        if (isStaged) {
                            if (matchStage.includes('Qualifier')) {
                                const groupNumInStage = parseInt(matchStage.replace('Qualifier ', ''));
                                const maxTeamsPerGroup = match.max_teams || 25;
                                teamQualifierGroup = Math.ceil((team.slot_number || 1) / maxTeamsPerGroup);
                                
                                // Only qualified if this is the team's assigned group
                                isQualified = groupNumInStage === teamQualifierGroup;
                            } else if (matchStage.includes('Semi-Final')) {
                                isQualified = team.qualified_upto === 'Semi-Final' || team.qualified_upto === 'Final';
                            } else if (matchStage.includes('Final')) {
                                isQualified = team.qualified_upto === 'Final';
                            }
                        }

                        return (
                            <div key={match.id || idx} className="glass" style={{
                                padding: '24px', borderRadius: '16px',
                                border: `1px solid ${hasRoom ? 'var(--primary)' : matchStatus === 'live' ? '#00ff9c' : matchStatus === 'room-open' ? '#FFD700' : 'var(--border)'}`,
                                position: 'relative',
                                opacity: (!isQualified && isStaged && matchStage.includes('Qualifier')) ? 0.6 : 1
                            }}>
                                {/* Stage Badge for Staged Tournaments */}
                                {isStaged && (
                                    <div style={{ 
                                        position: 'absolute', top: '-10px', right: '20px',
                                        background: 'var(--primary)', color: '#000',
                                        padding: '4px 12px', borderRadius: '8px',
                                        fontSize: '0.65rem', fontWeight: 900,
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                        zIndex: 1
                                    }}>
                                        STAGE: {matchStage.toUpperCase()}
                                    </div>
                                )}

                                {/* Match Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: hasRoom ? 'var(--primary)' : matchStatus === 'live' ? '#00ff9c' : 'var(--border)',
                                            color: '#000',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, fontSize: '0.9rem'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{match.tournament_name}</h4>
                                            {match.map && (
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px', display: 'inline-block' }}>
                                                    <i className="fas fa-map" style={{ marginRight: '4px' }}></i>{match.map} • {match.game?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Live Status Badge */}
                                    <span style={{
                                        background: `${statusConfig.color}15`,
                                        color: statusConfig.color,
                                        padding: '4px 12px', borderRadius: '12px',
                                        fontSize: '0.65rem', fontWeight: 800,
                                        border: `1px solid ${statusConfig.color}40`,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        animation: statusConfig.pulse ? 'pulse 2s infinite' : 'none',
                                    }}>
                                        <i className={statusConfig.icon}></i> {statusConfig.label}
                                    </span>
                                </div>

                                {/* Timing Section */}
                                <div className="grid-responsive" style={{ gap: '12px', marginBottom: '16px' }}>
                                    <div style={{
                                        background: matchStatus === 'room-open' ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
                                        padding: '14px', borderRadius: '12px',
                                        border: `1px solid ${matchStatus === 'room-open' ? 'rgba(255,215,0,0.25)' : 'var(--border)'}`,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.65rem', color: matchStatus === 'room-open' ? '#FFD700' : 'var(--text-dim)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <i className="fas fa-door-open" style={{ marginRight: '5px' }}></i>Room Opens
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: matchStatus === 'room-open' ? '#FFD700' : '#fff' }}>
                                            {match.room_time || 'TBD'}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: matchStatus === 'live' ? 'rgba(0,255,156,0.06)' : 'rgba(255,255,255,0.02)',
                                        padding: '14px', borderRadius: '12px',
                                        border: `1px solid ${matchStatus === 'live' ? 'rgba(0,255,156,0.25)' : 'var(--border)'}`,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.65rem', color: matchStatus === 'live' ? '#00ff9c' : 'var(--text-dim)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <i className="fas fa-play-circle" style={{ marginRight: '5px' }}></i>Match Starts
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: matchStatus === 'live' ? '#00ff9c' : '#fff' }}>
                                            {match.start_time || 'TBD'}
                                        </div>
                                    </div>
                                </div>

                                {/* Room Details with Qualification Gate */}
                                {!isQualified ? (
                                    <div style={{ 
                                        textAlign: 'center', padding: '20px', 
                                        background: isStaged && matchStage.includes('Qualifier') ? 'rgba(255,255,255,0.03)' : 'rgba(255,193,7,0.05)', 
                                        borderRadius: '12px',
                                        border: isStaged && matchStage.includes('Qualifier') ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,193,7,0.2)',
                                        color: isStaged && matchStage.includes('Qualifier') ? 'var(--text-dim)' : '#FFD700'
                                    }}>
                                        <i className={isStaged && matchStage.includes('Qualifier') ? "fas fa-users-slash" : "fas fa-lock"} style={{ fontSize: '1.5rem', marginBottom: '10px' }}></i>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                            {isStaged && matchStage.includes('Qualifier') ? `ASSIGNED TO GROUP ${teamQualifierGroup}` : 'NOT QUALIFIED YET'}
                                        </div>
                                        <p style={{ fontSize: '0.7rem', margin: '5px 0 0 0', opacity: 0.8 }}>
                                            {isStaged && matchStage.includes('Qualifier') 
                                                ? `Your squad is in Group ${teamQualifierGroup}. Please check the card for Match Qualifier ${teamQualifierGroup}.`
                                                : 'Only squads qualified by the host can view room details for this stage.'}
                                        </p>
                                    </div>
                                ) : hasRoom ? (
                                    <>
                                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                            <span style={{ background: 'rgba(0,255,156,0.15)', color: '#00ff9c', padding: '4px 14px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                                                ✓ ROOM DETAILS AVAILABLE
                                            </span>
                                        </div>
                                        <div className="grid-responsive" style={{ gap: '12px' }}>
                                            <div style={{ background: 'rgba(0,255,156,0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,255,156,0.15)' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Room ID</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '2px' }}>{match.room_id}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0,255,156,0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,255,156,0.15)' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Password</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '2px' }}>{match.room_password}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                        <i className="fas fa-hourglass-half" style={{ marginRight: '8px' }}></i>
                                        Room details not shared yet. You'll get a notification when available!
                                    </div>
                                )}

                                {/* Rank Upload Section */}
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    {rankScreenshots[match.id] ? (
                                        <div style={{
                                            background: 'rgba(0,255,156,0.05)', border: '1px solid rgba(0,255,156,0.2)',
                                            padding: '16px', borderRadius: '12px', textAlign: 'center',
                                        }}>
                                            <div style={{ color: '#00ff9c', fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <i className="fas fa-check-circle"></i> RANK UPLOADED
                                            </div>
                                            <img
                                                src={rankScreenshots[match.id]}
                                                alt="Rank Screenshot"
                                                style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', border: '2px solid rgba(0,255,156,0.3)' }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)',
                                            padding: '24px', borderRadius: '12px', textAlign: 'center',
                                        }}>
                                            <i className="fas fa-camera" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '12px' }}></i>
                                            <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#fff' }}>Submit Match Rank <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 400 }}>(Optional)</span></h5>
                                            <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                                Upload a screenshot of your final placement (Optional) to help the host calculate points.
                                            </p>

                                            <input
                                                type="file"
                                                id={`rank-upload-${match.id}`}
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                                onChange={(e) => handleRankUpload(match.id, e)}
                                            />
                                            <button
                                                className="btn btn-outline"
                                                disabled={uploadingRank === match.id}
                                                onClick={() => document.getElementById(`rank-upload-${match.id}`).click()}
                                                style={{ width: '100%', fontSize: '0.8rem', padding: '12px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                            >
                                                {uploadingRank === match.id ? (
                                                    <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> UPLOADING...</>
                                                ) : (
                                                    <><i className="fas fa-upload" style={{ marginRight: '8px' }}></i> UPLOAD SCREENSHOT</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Overall Standings / Leaderboard */}
            {team && team.host_code && (
                <div style={{ marginTop: '60px', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
                    <PointsLeaderboard 
                        hostCode={team.host_code} 
                        tournamentName={matches[0]?.tournament_name}
                        refreshTrigger={refreshLeaderboard}
                    />
                </div>
            )}
        </div>
    );
};

export default TeamPortalPage;
