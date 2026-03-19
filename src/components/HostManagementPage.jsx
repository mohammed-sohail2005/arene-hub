import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import PointsLeaderboard from './PointsLeaderboard';

const HostManagementPage = ({ tournament: initialTournament, onBack }) => {
    const { code: hostCode } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomDetails, setRoomDetails] = useState({});
    const [savingRoom, setSavingRoom] = useState({});
    const [viewingScreenshot, setViewingScreenshot] = useState(null);
    const [removingTeam, setRemovingTeam] = useState({});
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [confirmDisqualify, setConfirmDisqualify] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [squadRanks, setSquadRanks] = useState({});
    const [completingTournament, setCompletingTournament] = useState(false);
    const [prizeProofFile, setPrizeProofFile] = useState(null);
    const [prizeProofUploading, setPrizeProofUploading] = useState(false);
    const [entryMatch, setEntryMatch] = useState(null);
    const [currentSquadIdx, setCurrentSquadIdx] = useState(0);
    const [savingResults, setSavingResults] = useState(false);
    const [tempRank, setTempRank] = useState('');
    const [tempKills, setTempKills] = useState('');
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
    const notifiedRooms = useRef(new Set());

    useEffect(() => {
        if (entryMatch && teams[currentSquadIdx]) {
            const existing = squadRanks[teams[currentSquadIdx].id]?.[entryMatch.id];
            setTempRank(existing?.rank?.toString() || '');
            setTempKills(existing?.kills?.toString() || '');
        }
    }, [entryMatch, currentSquadIdx, squadRanks, teams]);

    useEffect(() => {
        fetchData();
    }, [hostCode]);

    // Room opening time reminder
    useEffect(() => {
        if (!matches.length) return;

        const checkRoomTime = () => {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMins = now.getMinutes();
            const currentTotalMins = currentHours * 60 + currentMins;

            matches.forEach(match => {
                if (!match.room_time || notifiedRooms.current.has(match.id)) return;
                if (roomDetails[match.id]?.room_id && roomDetails[match.id]?.room_password) return;

                // Only check room time on the tournament's actual date
                if (match.date) {
                    const today = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
                    const matchDate = typeof match.date === 'string' ? match.date.split('T')[0] : match.date;
                    if (matchDate !== today) return; // Not today, skip
                }

                // Parse room_time (format: "HH:MM:SS" or "HH:MM")
                const parts = match.room_time.split(':');
                const roomHours = parseInt(parts[0], 10);
                const roomMins = parseInt(parts[1], 10);
                const roomTotalMins = roomHours * 60 + roomMins;

                const diff = roomTotalMins - currentTotalMins;

                // Notify when within 5 mins of room time (or past it)
                if (diff <= 5 && diff >= -10) {
                    notifiedRooms.current.add(match.id);
                    const title = diff > 0 ? `⏰ Room opens in ${diff} mins!` : `🚨 Room time has passed!`;
                    const bodyMsg = `${match.tournament_name}\nUpload Room ID & Password ${diff > 0 ? 'now' : 'immediately'}!`;
                    
                    if (diff > 0) {
                        toast.warning(`${title}\n\n${bodyMsg}`);
                    } else {
                        toast.error(`${title}\n\n${bodyMsg}`);
                    }

                    // Native OS Notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(title, {
                            body: bodyMsg,
                            icon: '/logo.jpg',
                            requireInteraction: diff <= 0 // Keep persistent if room time passed
                        });
                    }
                }
            });
        };

        checkRoomTime();
        const interval = setInterval(checkRoomTime, 30000); // every 30s
        return () => clearInterval(interval);
    }, [matches, roomDetails, toast]);

    const fetchData = async () => {
        if (!hostCode) return;
        setLoading(true);
        setFetchError(null);
        try {
            // If tournament prop is missing (e.g. on refresh), we should still show something
            // The fetchData already gets the matches by hostCode, so we are good for the list.
            
            const { data: matchData, error: matchErr } = await supabase
                .from('tournaments')
                .select('*')
                .eq('host_code', hostCode)
                .order('start_time', { ascending: true });

            if (matchErr) throw matchErr;

            if (!matchData || matchData.length === 0) {
                setFetchError('No tournaments found for this host code. Make sure the host_code column exists in your tournaments table.');
                setMatches([]);
                setLoading(false);
                return;
            }

            setMatches(matchData);

            const details = {};
            matchData.forEach(m => {
                details[m.id] = {
                    room_id: m.room_id || '',
                    room_password: m.room_password || '',
                    room_time: m.room_time || '',
                    start_time: m.start_time || '',
                };
            });
            setRoomDetails(details);

            // Fetch teams
            const { data: teamData, error: teamError } = await supabase
                .from('registrations')
                .select('*')
                .eq('host_code', hostCode)
                .order('created_at', { ascending: true });

            if (teamError) throw teamError;

            // Fetch squad ranks for matches relating to this host
            const { data: rankData, error: rankError } = await supabase
                .from('squad_ranks')
                .select('*, registrations!inner(host_code)')
                .eq('registrations.host_code', hostCode);

            if (!rankError && rankData) {
                // Map: registration_id -> { match_id: { url, rank, kills, points } }
                const rankMap = {};
                rankData.forEach(r => {
                    if (!rankMap[r.registration_id]) rankMap[r.registration_id] = {};
                    rankMap[r.registration_id][r.match_id] = {
                        url: r.screenshot_url,
                        rank: r.rank,
                        kills: r.kills,
                        points: r.points
                    };
                });
                setSquadRanks(rankMap);
            }

            if (teamData) {
                const teamsWithSlots = (teamData || [])
                    .filter(t => t.status !== 'kicked' && t.status !== 'disqualified')
                    .map((t, idx) => ({ 
                        ...t, 
                        slot_number: t.slot_number || idx + 1 
                    }));
                setTeams(teamsWithSlots);
            }
        } catch (err) {
            console.error('Error fetching host data:', err);
            setFetchError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomDetailChange = (matchId, field, value) => {
        setRoomDetails(prev => ({
            ...prev,
            [matchId]: { ...prev[matchId], [field]: value },
        }));
    };

    const saveRoomDetails = async (matchId) => {
        const rid = roomDetails[matchId]?.room_id;
        const rpwd = roomDetails[matchId]?.room_password;
        const rtime = roomDetails[matchId]?.room_time;
        const stime = roomDetails[matchId]?.start_time;

        // If user entered one of ID/Password but not the other, warn them
        if ((rid && !rpwd) || (!rid && rpwd)) {
            toast.warning('Please enter both Room ID and Password, or leave both empty to just update timings.');
            return;
        }

        setSavingRoom(prev => ({ ...prev, [matchId]: true }));
        try {
            const updateData = {};
            if (rid && rpwd) {
                updateData.room_id = rid;
                updateData.room_password = rpwd;
            }

            // Always save timings
            if (rtime) updateData.room_time = rtime;
            if (stime) updateData.start_time = stime;

            const { error } = await supabase
                .from('tournaments')
                .update(updateData)
                .eq('id', matchId);

            if (error) throw error;
            toast.success('✅ Match details saved!\n\nTimings and room details have been updated.');
        } catch (err) {
            console.error('Error saving match details:', err);
            toast.error(`Failed to save details!\n\n${err.message}`);
        } finally {
            setSavingRoom(prev => ({ ...prev, [matchId]: false }));
        }
    };


    const handleSaveResult = async (matchId, registrationId, rank, kills) => {
        setSavingResults(true);
        try {
            const match = matches.find(m => m.id === matchId);
            const pointSystem = match?.point_system || { kill: 1, rank_1: 15, rank_2: 12, rank_3: 10, rank_4: 8, rank_5: 6, rank_6: 4, rank_7: 2, rank_8: 1, rank_9: 1, rank_10: 1, rank_11: 0, rank_12: 0 };
            
            const killPoints = (parseInt(kills) || 0) * (pointSystem.kill || 0);
            const rankPoints = pointSystem[`rank_${rank}`] || 0;
            const totalPoints = killPoints + rankPoints;

            const { error } = await supabase
                .from('squad_ranks')
                .upsert({
                    match_id: matchId,
                    registration_id: registrationId,
                    rank: parseInt(rank),
                    kills: parseInt(kills),
                    points: totalPoints
                }, { onConflict: 'match_id, registration_id' });

            if (error) throw error;

            // Update local state
            setSquadRanks(prev => ({
                ...prev,
                [registrationId]: {
                    ...(prev[registrationId] || {}),
                    [matchId]: {
                        ...(prev[registrationId]?.[matchId] || {}),
                        rank: parseInt(rank),
                        kills: parseInt(kills),
                        points: totalPoints
                    }
                }
            }));

            setLeaderboardRefresh(prev => prev + 1);
            toast.success('Result saved successfully!');
        } catch (err) {
            console.error('Error saving result:', err);
            toast.error(`Failed to save result: ${err.message}`);
        } finally {
            setSavingResults(false);
        }
    };

    const handleQualify = async (teamId, stage) => {
        try {
            const msg = stage === 'None' 
                ? null 
                : `Congratulations! Your squad has been selected for the ${stage} stage.`;
            
            const { error } = await supabase
                .from('registrations')
                .update({ 
                    qualified_upto: stage,
                    selection_message: msg,
                    status: 'Active',
                    qualified_at: new Date().toISOString()
                })
                .eq('id', teamId);

            if (error) throw error;
            
            setTeams(prev => prev.filter(t => t.id !== teamId)); // Remove from view instead of just updating
            toast.success(`Success! Squad is now qualified for ${stage}. They will now move to the next stage list.`);
        } catch (err) {
            console.error('Error qualifying team:', err);
            toast.error(`Qualification failed!\n\n${err.message}`);
        }
    };

    const handleDisqualify = async (teamId) => {
        try {
            const msg = "We regret to inform you that your squad was not selected for the next stage. Your team code is now disabled.";
            const { error } = await supabase
                .from('registrations')
                .update({ 
                    status: 'disqualified',
                    selection_message: msg
                })
                .eq('id', teamId);

            if (error) throw error;
            
            setTeams(prev => prev.filter(t => t.id !== teamId));
            toast.success("Squad has been disqualified and removed from your view.");
        } catch (err) {
            console.error('Error disqualifying team:', err);
            toast.error(`Disqualification failed!\n\n${err.message}`);
        }
    };

    const removeTeam = async (teamId, squadName) => {
        setRemovingTeam(prev => ({ ...prev, [teamId]: true }));
        try {
            // Mark as kicked instead of deleting, so player sees the message
            const { error } = await supabase
                .from('registrations')
                .update({ status: 'kicked' })
                .eq('id', teamId);

            if (error) {
                // Fallback: if status column doesn't exist, delete instead
                const { error: delErr } = await supabase
                    .from('registrations')
                    .delete()
                    .eq('id', teamId);
                if (delErr) throw delErr;
            }

            setTeams(prev => prev.filter(t => t.id !== teamId));
            setConfirmRemove(null);
            toast.success(`Squad "${squadName}" has been removed from the tournament.`);
        } catch (err) {
            console.error('Error removing team:', err);
            toast.error(`Failed to remove squad!\n\n${err.message}`);
        } finally {
            setRemovingTeam(prev => ({ ...prev, [teamId]: false }));
        }
    };

    const handleCompleteTournament = async () => {
        setPrizeProofUploading(true);
        try {
            let publicUrl = null;

            if (prizeProofFile) {
                try {
                    const fileExt = prizeProofFile.name.split('.').pop();
                    const fileName = `prize-${hostCode}-${Math.random()}.${fileExt}`;
                    const filePath = `proofs/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('tournaments')
                        .upload(filePath, prizeProofFile, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl: url } } = supabase.storage
                        .from('tournaments')
                        .getPublicUrl(filePath);
                    
                    publicUrl = url;

                    const tournamentName = matches[0]?.tournament_name?.replace(/ - Match \d+$/, '') || 'Tournament';

                    const { error: proofError } = await supabase
                        .from('host_proofs')
                        .insert({
                            host_code: hostCode,
                            upi_id: matches[0]?.upi_id || 'N/A',
                            tournament_name: tournamentName,
                            screenshot_url: publicUrl
                        });

                    if (proofError) {
                        console.error("Proof insert error:", proofError);
                        toast.warning('Proof saved, but could not add to Integrity list. Proceeding to delete.');
                    }
                } catch (err) {
                    console.error('Error uploading proof:', err);
                    toast.warning('Failed to upload proof, but proceeding with tournament completion.');
                }
            }

            // CLEANUP: 1. Delete all payment screenshots from Storage
            const teamScreenshots = teams.filter(t => t.payment_screenshot_url).map(t => {
                const parts = t.payment_screenshot_url.split('/');
                return parts[parts.length - 1];
            });

            if (teamScreenshots.length > 0) {
                await supabase.storage.from('tournaments').remove(teamScreenshots);
            }

            // CLEANUP: 2. Remove all registrations linked to this host_code
            // Archive the tournaments to preserve Host Integrity
            await supabase.from('tournaments')
                .update({ host_code: `archived_paid_${hostCode}`, status: 'Completed' })
                .eq('host_code', hostCode);

            await supabase.from('registrations').delete().eq('host_code', hostCode);

            toast.success('🎉 Tournament Completed & Archived!');
            onBack();

        } catch (err) {
            console.error('Error completing tournament:', err);
            toast.error(err.message || 'Failed to complete tournament.');
        } finally {
            setPrizeProofUploading(false);
            setCompletingTournament(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '15px', color: 'var(--primary)' }}></i>
                <p>Loading Host Management...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
                <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
                </button>
                <div className="glass" style={{ padding: '50px', textAlign: 'center', borderRadius: '16px', border: '1px solid #ff4d4d' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ff4d4d', marginBottom: '16px' }}></i>
                    <h3 style={{ color: '#ff4d4d', marginBottom: '12px' }}>Unable to Load</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '20px' }}>{fetchError}</p>
                    <button className="btn btn-primary" onClick={fetchData} style={{ padding: '10px 30px' }}>
                        <i className="fas fa-redo" style={{ marginRight: '8px' }}></i> TRY AGAIN
                    </button>
                </div>
            </div>
        );
    }

    const paidTeams = teams.filter(t => t.payment_screenshot_url);

    return (
        <div className="page-container">
            {/* Complete Tournament Modal */}
            {completingTournament && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass" style={{
                        padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%',
                        border: '1px solid #00ff9c', textAlign: 'center'
                    }}>
                        <i className="fas fa-trophy" style={{ fontSize: '3rem', color: '#00ff9c', marginBottom: '20px' }}></i>
                        <h2 style={{ margin: '0 0 10px 0', color: '#fff' }}>Complete Tournament</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>
                            Upload a screenshot proving you paid the winner(s) <strong style={{ color: 'var(--primary)' }}>(Optional)</strong>. This builds trust! Afterwards, this tournament and the 6-digit code will be fully deleted.
                        </p>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block', background: 'rgba(0,255,156,0.1)', border: '1px dashed #00ff9c',
                                padding: '20px', borderRadius: '12px', cursor: 'pointer', color: prizeProofFile ? '#fff' : 'var(--primary)',
                                transition: '0.3s'
                            }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={e => setPrizeProofFile(e.target.files[0])}
                                />
                                {prizeProofFile ? (
                                    <><i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#00ff9c' }}></i> {prizeProofFile.name}</>
                                ) : (
                                    <><i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i> Click up upload Proof Screenshot <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(Optional)</span></>
                                )}
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-outline"
                                style={{ flex: 1, padding: '12px' }}
                                onClick={() => { setCompletingTournament(false); setPrizeProofFile(null); }}
                                disabled={prizeProofUploading}
                            >
                                CANCEL
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #00ff9c, #00cc7a)', color: '#000' }}
                                onClick={handleCompleteTournament}
                                disabled={prizeProofUploading}
                            >
                                {prizeProofUploading ? <><i className="fas fa-circle-notch fa-spin"></i> UPLOADING...</> : 'FINISH & DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Screenshot Viewer Modal */}
            {viewingScreenshot && (
                <div
                    onClick={() => setViewingScreenshot(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.92)', zIndex: 9999,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '20px', cursor: 'pointer',
                    }}
                >
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 6px 0', color: 'var(--primary)' }}>
                            {viewingScreenshot.isRank ? 'Match Result Proof' : 'Payment Proof'}
                        </h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>{viewingScreenshot.teamName}</p>
                    </div>

                    <div className="wrap-mobile" style={{ gap: '30px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1200px' }}>
                        <img
                            src={viewingScreenshot.url}
                            alt="Screenshot"
                            style={{
                                maxWidth: '90%', 
                                maxHeight: '80vh', objectFit: 'contain',
                                borderRadius: '12px', border: '2px solid var(--primary)',
                            }}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>

                    <button
                        onClick={() => setViewingScreenshot(null)}
                        style={{
                            marginTop: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)',
                            color: '#fff', padding: '10px 30px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem'
                        }}
                    >
                        <i className="fas fa-times" style={{ marginRight: '6px' }}></i> Close Preview
                    </button>
                </div>
            )}


            {/* Header */}
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
            </button>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>HOST <span style={{ color: 'var(--primary)' }}>MANAGEMENT</span></h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Host Code: <span style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '3px' }}>{hostCode}</span>
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="btn hover-glow"
                        onClick={() => {
                            const link = `${window.location.origin}/details/${matches[0]?.id}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Registration Link Copied!');
                            navigate(`/details/${matches[0]?.id}`);
                        }}
                        style={{
                            background: 'rgba(0, 255, 156, 0.1)',
                            border: '1px solid #00ff9c',
                            color: '#00ff9c',
                            padding: '10px 24px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 800
                        }}
                    >
                        <i className="fas fa-link" style={{ marginRight: '8px' }}></i>
                        COPY REGISTRATION LINK
                    </button>

                    <button
                        className="btn hover-glow"
                        onClick={() => setCompletingTournament(true)}
                        style={{
                            background: 'rgba(255, 77, 77, 0.1)',
                            border: '1px solid #ff4d4d',
                            color: '#ff4d4d',
                            padding: '10px 24px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 800
                        }}
                    >
                        <i className="fas fa-check-double" style={{ marginRight: '8px' }}></i>
                        COMPLETE & DELETE TOURNAMENT
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                <div className="glass" style={{ padding: '22px', textAlign: 'center', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{matches.length}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Matches</div>
                </div>
                <div className="glass" style={{ padding: '22px', textAlign: 'center', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{teams.length}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teams Registered</div>
                </div>
                <div className="glass" style={{ padding: '22px', textAlign: 'center', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00ff9c' }}>{paidTeams.length}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Payments Received</div>
                </div>
                <div className="glass" style={{ padding: '22px', textAlign: 'center', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFD700' }}>
                        {Object.values(roomDetails).filter(r => r.room_id && r.room_password).length}/{matches.length}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rooms Set</div>
                </div>
            </div>

            {/* Room ID & Password per Match */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-key" style={{ color: 'var(--primary)' }}></i> Room Details
                </h2>

                <div style={{ display: 'grid', gap: '16px' }}>
                    {matches.map((match, idx) => {
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

                        const borderColor = matchStatus === 'live' ? '#00ff9c' : matchStatus === 'room-open' ? '#FFD700' : 'var(--border)';
                        const isSet = roomDetails[match.id]?.room_id && roomDetails[match.id]?.room_password;

                        return (
                            <div key={match.id} className="glass" style={{ padding: '24px', borderRadius: '16px', border: `1px solid ${isSet ? 'var(--primary)' : borderColor}` }}>
                                {/* Match Header */}
                                <div className="wrap-mobile" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: isSet ? 'var(--primary)' : matchStatus === 'live' ? '#00ff9c' : matchStatus === 'room-open' ? '#FFD700' : 'var(--border)',
                                            color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, fontSize: '0.9rem', flexShrink: 0,
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{match.tournament_name}</h4>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                                {match.map && <span><i className="fas fa-map" style={{ marginRight: '4px' }}></i>{match.map}</span>}
                                                {match.game && <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 6px', marginLeft: '8px' }}>{match.game?.toUpperCase()}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Status badge */}
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800,
                                        background: isSet ? 'rgba(0,255,156,0.15)' : matchStatus === 'live' ? 'rgba(0,255,156,0.15)' : matchStatus === 'room-open' ? 'rgba(255,215,0,0.15)' : 'rgba(255,77,77,0.1)',
                                        color: isSet ? '#00ff9c' : matchStatus === 'live' ? '#00ff9c' : matchStatus === 'room-open' ? '#FFD700' : '#ff4d4d',
                                        border: `1px solid ${isSet ? 'rgba(0,255,156,0.3)' : matchStatus === 'live' ? 'rgba(0,255,156,0.3)' : matchStatus === 'room-open' ? 'rgba(255,215,0,0.3)' : 'rgba(255,77,77,0.2)'}`,
                                        animation: matchStatus !== 'upcoming' && !isSet ? 'pulse 2s infinite' : 'none',
                                    }}>
                                        {isSet ? '✓ SET' : matchStatus === 'live' ? '▶ LIVE' : matchStatus === 'room-open' ? '🚪 ROOM TIME' : '⏳ PENDING'}
                                    </span>
                                </div>

                                {/* Timing Section */}
                                <div className="grid-responsive" style={{ gap: '12px', marginBottom: '16px' }}>
                                    <div style={{
                                        background: matchStatus === 'room-open' ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
                                        padding: '12px', borderRadius: '10px', textAlign: 'center',
                                        border: `1px solid ${matchStatus === 'room-open' ? 'rgba(255,215,0,0.25)' : 'var(--border)'}`,
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: matchStatus === 'room-open' ? '#FFD700' : 'var(--text-dim)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <i className="fas fa-door-open" style={{ marginRight: '4px' }}></i>Room Opens
                                        </div>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={roomDetails[match.id]?.room_time || ''}
                                            onChange={e => handleRoomDetailChange(match.id, 'room_time', e.target.value)}
                                            style={{
                                                textAlign: 'center', fontSize: '1rem', fontWeight: 800, padding: '6px 8px',
                                                color: matchStatus === 'room-open' ? '#FFD700' : '#fff',
                                                background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                                            }}
                                        />
                                    </div>
                                    <div style={{
                                        background: matchStatus === 'live' ? 'rgba(0,255,156,0.06)' : 'rgba(255,255,255,0.02)',
                                        padding: '12px', borderRadius: '10px', textAlign: 'center',
                                        border: `1px solid ${matchStatus === 'live' ? 'rgba(0,255,156,0.25)' : 'var(--border)'}`,
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: matchStatus === 'live' ? '#00ff9c' : 'var(--text-dim)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <i className="fas fa-play-circle" style={{ marginRight: '4px' }}></i>Match Starts
                                        </div>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={roomDetails[match.id]?.start_time || ''}
                                            onChange={e => handleRoomDetailChange(match.id, 'start_time', e.target.value)}
                                            style={{
                                                textAlign: 'center', fontSize: '1rem', fontWeight: 800, padding: '6px 8px',
                                                color: matchStatus === 'live' ? '#00ff9c' : '#fff',
                                                background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Room ID & Password Inputs */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Room ID</label>
                                        <input
                                            className="form-control"
                                            placeholder="Enter Room ID"
                                            value={roomDetails[match.id]?.room_id || ''}
                                            onChange={e => handleRoomDetailChange(match.id, 'room_id', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Password</label>
                                        <input
                                            className="form-control"
                                            placeholder="Enter Password"
                                            value={roomDetails[match.id]?.room_password || ''}
                                            onChange={e => handleRoomDetailChange(match.id, 'room_password', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '10px 20px', fontSize: '0.75rem' }}
                                            onClick={() => saveRoomDetails(match.id)}
                                            disabled={savingRoom[match.id]}
                                        >
                                            {savingRoom[match.id] ? <i className="fas fa-circle-notch fa-spin"></i> : 'SAVE'}
                                        </button>
                                        <button
                                            className="btn hover-glow"
                                            style={{ 
                                                padding: '10px 20px', 
                                                fontSize: '0.75rem', 
                                                background: 'rgba(0, 255, 156, 0.1)', 
                                                border: '1px solid var(--primary)',
                                                color: 'var(--primary)',
                                                fontWeight: 800
                                            }}
                                            onClick={() => {
                                                setEntryMatch(match);
                                                setCurrentSquadIdx(0);
                                            }}
                                        >
                                            <i className="fas fa-edit" style={{ marginRight: '6px' }}></i> ENTER RESULTS
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>

                {/* Leaderboard Section */}
                <PointsLeaderboard 
                    hostCode={hostCode} 
                    tournamentName={initialTournament?.tournament_name || matches[0]?.tournament_name} 
                    games={matches.length}
                    refreshTrigger={leaderboardRefresh}
                />
            </div>

            {/* Registered Teams with Payment Proof */}
            <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-users" style={{ color: 'var(--primary)' }}></i> Registered Teams ({teams.length})
                </h2>

                {teams.length === 0 ? (
                    <div className="glass" style={{ padding: '50px', textAlign: 'center', borderRadius: '16px' }}>
                        <i className="fas fa-inbox" style={{ fontSize: '2rem', color: 'var(--border)', marginBottom: '12px' }}></i>
                        <p style={{ color: 'var(--text-dim)' }}>No teams registered yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {teams.map((team, idx) => (
                            <div key={team.id || idx} className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                {/* Team Header */}
                                <div className="wrap-mobile" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '50%',
                                            background: team.squad_logo_url ? 'transparent' : 'var(--primary)', 
                                            color: '#000',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, fontSize: '1rem',
                                            border: team.squad_logo_url ? '1px solid var(--primary)' : 'none',
                                            overflow: 'hidden', flexShrink: 0
                                        }}>
                                            {team.squad_logo_url ? (
                                                <img src={team.squad_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{team.squad_name}</h4>
                                                <span style={{ 
                                                    background: 'rgba(0, 255, 156, 0.15)', 
                                                    color: 'var(--primary)', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '0.6rem', 
                                                    fontWeight: 900,
                                                    border: '1px solid rgba(0, 255, 156, 0.3)'
                                                }}>
                                                    SLOT {team.slot_number || idx + 1}
                                                </span>
                                                {matches.some(m => m.is_staged) && (
                                                    <span style={{ 
                                                        background: 'rgba(255, 255, 255, 0.1)', 
                                                        color: '#fff', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.6rem', 
                                                        fontWeight: 900,
                                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                                    }}>
                                                        GROUP {Math.ceil((team.slot_number || idx + 1) / (matches[0]?.max_teams || 25))}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                                Team Code: <span style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '2px' }}>{team.team_code}</span>
                                                <span style={{ margin: '0 8px' }}>•</span>
                                                {team.players ? (Array.isArray(team.players) ? team.players.length : JSON.parse(team.players).length) : 0} Players
                                                {team.squad_upi && (
                                                    <span style={{ display: 'block', marginTop: '4px' }}>
                                                        UPI: <span style={{ color: '#fff', fontWeight: 600 }}>{team.squad_upi}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Status & View Button */}
                                    <div className="wrap-mobile" style={{ alignItems: 'center', gap: '10px' }}>
                                        {/* Qualification Controls for Staged Tournaments */}
                                        {matches.some(m => m.is_staged) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}>
                                                <select 
                                                    className="form-control"
                                                    style={{ 
                                                        padding: '4px 8px', 
                                                        fontSize: '0.7rem', 
                                                        width: 'auto', 
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: team.status === 'disqualified' ? '1px solid #ff4d4d' : '1px solid var(--border)'
                                                    }}
                                                    value={team.qualified_upto || 'None'}
                                                    onChange={(e) => handleQualify(team.id, e.target.value)}
                                                >
                                                    <option value="None">Qualified: None</option>
                                                    {[...new Set(matches.filter(m => m.is_staged).map(m => m.stage))].map(stg => (
                                                        <option key={stg} value={stg}>Qualified: {stg}</option>
                                                    ))}
                                                </select>
                                                
                                                {team.status !== 'disqualified' && (
                                                    <button
                                                        onClick={() => setConfirmDisqualify(team)}
                                                        style={{
                                                            background: 'rgba(255,165,0,0.1)', border: '1px solid #FFA500',
                                                            color: '#FFA500', padding: '6px 14px', borderRadius: '8px',
                                                            fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
                                                            display: 'flex', alignItems: 'center', gap: '5px'
                                                        }}
                                                        title="Disqualify for next stage"
                                                    >
                                                        <i className="fas fa-user-slash"></i> DISQUALIFY
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {team.status === 'disqualified' ? (
                                            <span style={{
                                                background: 'rgba(255,77,77,0.15)', color: '#ff4d4d',
                                                padding: '4px 10px', borderRadius: '8px',
                                                fontSize: '0.65rem', fontWeight: 900,
                                                border: '1px solid rgba(255,77,77,0.3)'
                                            }}>
                                                🚫 DISQUALIFIED
                                            </span>
                                        ) : team.payment_screenshot_url ? (
                                            <>
                                                <span style={{
                                                    background: 'rgba(0,255,156,0.1)', color: '#00ff9c',
                                                    padding: '4px 10px', borderRadius: '8px',
                                                    fontSize: '0.65rem', fontWeight: 700,
                                                }}>
                                                    ✅ PAID
                                                </span>
                                                <button
                                                    onClick={() => setViewingScreenshot({ teamName: team.squad_name, url: team.payment_screenshot_url })}
                                                    style={{
                                                        background: 'rgba(0,255,156,0.1)', border: '1px solid var(--primary)',
                                                        color: 'var(--primary)', padding: '6px 14px', borderRadius: '8px',
                                                        fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                    }}
                                                >
                                                    <i className="fas fa-eye"></i> View Payment
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{
                                                background: 'rgba(255,165,0,0.1)', color: '#FFA500',
                                                padding: '4px 10px', borderRadius: '8px',
                                                fontSize: '0.65rem', fontWeight: 700,
                                            }}>
                                                ⚠️ NO PROOF
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setConfirmRemove(team.id)}
                                            style={{
                                                background: 'rgba(255,77,77,0.1)', border: '1px solid #ff4d4d',
                                                color: '#ff4d4d', padding: '6px 14px', borderRadius: '8px',
                                                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                            }}
                                        >
                                            <i className="fas fa-trash-alt"></i> Remove
                                        </button>
                                    </div>

                                    {/* Confirm Remove Popup */}
                                    {confirmRemove === team.id && (
                                        <div style={{
                                            marginTop: '12px', padding: '14px 18px', borderRadius: '12px',
                                            background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                                        }}>
                                            <span style={{ fontSize: '0.8rem', color: '#ff4d4d', fontWeight: 600 }}>
                                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                                Remove "{team.squad_name}"? This cannot be undone.
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => setConfirmRemove(null)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                                                        color: '#fff', padding: '6px 16px', borderRadius: '8px',
                                                        fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600,
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => removeTeam(team.id, team.squad_name)}
                                                    disabled={removingTeam[team.id]}
                                                    style={{
                                                        background: '#ff4d4d', border: 'none',
                                                        color: '#fff', padding: '6px 16px', borderRadius: '8px',
                                                        fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
                                                    }}
                                                >
                                                    {removingTeam[team.id] ? <i className="fas fa-circle-notch fa-spin"></i> : 'Yes, Remove'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* Confirm Disqualify Popup */}
                                    {confirmDisqualify?.id === team.id && (
                                        <div style={{
                                            marginTop: '12px', padding: '14px 18px', borderRadius: '12px',
                                            background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                                        }}>
                                            <span style={{ fontSize: '0.8rem', color: '#FFA500', fontWeight: 600 }}>
                                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                                Disqualify "{team.squad_name}"? This will notify them via Team Portal.
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => setConfirmDisqualify(null)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                                                        color: '#fff', padding: '6px 16px', borderRadius: '8px',
                                                        fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600,
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDisqualify(team.id);
                                                        setConfirmDisqualify(null);
                                                    }}
                                                    style={{
                                                        background: '#FFA500', border: 'none',
                                                        color: '#000', padding: '6px 16px', borderRadius: '8px',
                                                        fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
                                                    }}
                                                >
                                                    Yes, Disqualify
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Player Details */}
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                        {(Array.isArray(team.players) ? team.players : JSON.parse(team.players || '[]')).map((p, pIdx) => (
                                            <div key={pIdx} style={{ background: 'rgba(0,255,156,0.03)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,255,156,0.1)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ID: {p.id}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Post-Match Ranks */}
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,255,156,0.15)' }}>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#00ff9c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-camera"></i> Match Ranks Uploaded
                                    </h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                                        {matches.map((match, mIdx) => {
                                            const matchLabel = `Match ${mIdx + 1}`;
                                            const hasUploaded = squadRanks[team.id] && squadRanks[team.id][match.id];
                                            const url = hasUploaded ? squadRanks[team.id][match.id] : null;

                                            return hasUploaded ? (
                                                    <button
                                                        key={match.id}
                                                        onClick={() => setViewingScreenshot({ 
                                                            teamName: `${team.squad_name} - ${matchLabel}`, 
                                                            url: hasUploaded 
                                                        })}
                                                        className="btn hover-glow"
                                                        style={{
                                                            background: 'rgba(0,255,156,0.1)', 
                                                            border: '1px dashed #00ff9c',
                                                            padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '0.75rem',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{matchLabel}</span>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>View Rank Proof</div>
                                                    </button>
                                            ) : (
                                                <div
                                                    key={match.id}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)',
                                                        padding: '10px', borderRadius: '8px', color: 'var(--text-dim)', fontSize: '0.7rem',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    <i className="fas fa-clock" style={{ fontSize: '1.2rem' }}></i>
                                                    {matchLabel} Pending
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Match Results Entry Modal */}
            {entryMatch && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.95)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass" style={{
                        width: '100%', maxWidth: '1200px', height: '90vh',
                        display: 'flex', flexDirection: 'column', borderRadius: '24px',
                        border: '1px solid var(--primary)', overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>SQUAD VERIFICATION & RESULTS</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                    Match: {entryMatch.tournament_name} • {entryMatch.map}
                                </p>
                            </div>
                            <button onClick={() => setEntryMatch(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Split Screen Body */}
                        <div className="wrap-mobile" style={{ flex: 1, overflow: 'hidden' }}>
                            {/* Left Side: Screenshot */}
                            <div style={{ flex: 1.5, background: '#0a0a0a', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ padding: '15px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>
                                        <i className="fas fa-eye" style={{ marginRight: '8px' }}></i>
                                        {teams[currentSquadIdx]?.squad_name} Proof
                                    </h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                        Squad {currentSquadIdx + 1} of {teams.length}
                                    </span>
                                </div>
                                <div style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {squadRanks[teams[currentSquadIdx]?.id]?.[entryMatch.id]?.url ? (
                                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                            <img 
                                                src={squadRanks[teams[currentSquadIdx].id][entryMatch.id].url} 
                                                alt="Rank Proof" 
                                                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                                            <i className="fas fa-image" style={{ fontSize: '4rem', marginBottom: '15px', opacity: 0.2 }}></i>
                                            <p>No screenshot uploaded by this squad for this match.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Entry Form */}
                            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ marginBottom: '35px' }}>
                                    <h3 style={{ margin: '0 0 10px 0' }}>Enter Match Stats</h3>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Review the screenshot on the left and enter the squad's performance.</p>
                                </div>

                                <div className="form-group" style={{ marginBottom: '25px' }}>
                                    <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Placement Rank (1-25)</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        style={{ fontSize: '1.5rem', fontWeight: 900, height: '60px', textAlign: 'center' }}
                                        placeholder="Enter Rank"
                                        value={tempRank}
                                        onChange={e => setTempRank(e.target.value)}
                                        min="1"
                                        max="100"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '40px' }}>
                                    <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Total Kills</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        style={{ fontSize: '1.5rem', fontWeight: 900, height: '60px', textAlign: 'center' }}
                                        placeholder="Enter Kills"
                                        value={tempKills}
                                        onChange={e => setTempKills(e.target.value)}
                                        min="0"
                                    />
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', padding: '20px', fontSize: '1.1rem', fontWeight: 800, marginBottom: '40px' }}
                                    onClick={() => handleSaveResult(entryMatch.id, teams[currentSquadIdx].id, tempRank, tempKills)}
                                    disabled={savingResults}
                                >
                                    {savingResults ? <><i className="fas fa-circle-notch fa-spin"></i> SAVING...</> : <><i className="fas fa-save" style={{ marginRight: '10px' }}></i> SAVE RESULTS</>}
                                </button>

                                {/* Points Preview */}
                                {tempRank && (
                                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--primary)', background: 'rgba(0,255,156,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Rank #{tempRank} Points:</span>
                                            <span style={{ fontWeight: 800 }}>{entryMatch.point_system?.[`rank_${tempRank}`] || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Kill Points ({tempKills || 0} × {entryMatch.point_system?.kill || 1}):</span>
                                            <span style={{ fontWeight: 800 }}>{(parseInt(tempKills) || 0) * (entryMatch.point_system?.kill || 1)}</span>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(0,255,156,0.2)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                                            <span style={{ color: 'var(--primary)' }}>TOTAL POINTS:</span>
                                            <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                                                {(entryMatch.point_system?.[`rank_${tempRank}`] || 0) + ((parseInt(tempKills) || 0) * (entryMatch.point_system?.kill || 1))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer: Navigation */}
                        <div style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '12px 25px' }}
                                disabled={currentSquadIdx === 0}
                                onClick={() => setCurrentSquadIdx(prev => prev - 1)}
                            >
                                <i className="fas fa-chevron-left" style={{ marginRight: '10px' }}></i> PREVIOUS SQUAD
                            </button>
                            
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '300px', padding: '10px' }}>
                                {teams.map((_, idx) => (
                                    <div key={idx} style={{ 
                                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                        background: idx === currentSquadIdx ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        transition: '0.3s'
                                    }}></div>
                                ))}
                            </div>

                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '12px 25px' }}
                                disabled={currentSquadIdx === teams.length - 1}
                                onClick={() => setCurrentSquadIdx(prev => prev + 1)}
                            >
                                NEXT SQUAD <i className="fas fa-chevron-right" style={{ marginLeft: '10px' }}></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostManagementPage;
