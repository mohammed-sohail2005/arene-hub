import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';

const PointsLeaderboard = ({ hostCode, tournamentName, games, refreshTrigger }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const leaderboardRef = useRef(null);

    useEffect(() => {
        fetchLeaderboard();
    }, [hostCode, refreshTrigger]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // 1. Fetch all matches for this hostCode
            const { data: matchData, error: matchErr } = await supabase
                .from('tournaments')
                .select('id, tournament_name, stage')
                .eq('host_code', hostCode)
                .order('created_at', { ascending: true });

            if (matchErr) throw matchErr;
            setMatches(matchData);

            // 2. Fetch all teams for this hostCode
            const { data: teamData, error: teamErr } = await supabase
                .from('registrations')
                .select('id, squad_name, squad_logo_url')
                .eq('host_code', hostCode)
                .neq('status', 'kicked');

            if (teamErr) throw teamErr;

            // 3. Fetch all ranks for these teams/matches
            const { data: rankData, error: rankErr } = await supabase
                .from('squad_ranks')
                .select('registration_id, match_id, rank, kills, points')
                .in('registration_id', teamData.map(t => t.id));

            if (rankErr) throw rankErr;

            // 4. Calculate Cumulative Scores
            const leaderboard = teamData.map(team => {
                const teamRanks = rankData.filter(r => r.registration_id === team.id);
                const totalKills = teamRanks.reduce((sum, r) => sum + (r.kills || 0), 0);
                const totalPoints = teamRanks.reduce((sum, r) => sum + (r.points || 0), 0);
                
                // Track points per match for reference if needed
                const matchScores = {};
                matchData.forEach(m => {
                    const mRank = teamRanks.find(r => r.match_id === m.id);
                    matchScores[m.id] = mRank ? mRank.points : 0;
                });

                return {
                    ...team,
                    totalKills,
                    totalPoints,
                    matchScores
                };
            });

            // Sort by Total Points (desc), then Kills (desc)
            leaderboard.sort((a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills);
            setLeaderboardData(leaderboard);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadLeaderboard = async () => {
        if (!leaderboardRef.current) return;
        try {
            const canvas = await html2canvas(leaderboardRef.current, {
                backgroundColor: '#0a0a0a',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `${tournamentName || 'Tournament'}_Leaderboard.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error exporting leaderboard:', err);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '15px' }}></i>
                <p>Generating Leaderboard...</p>
            </div>
        );
    }

    if (leaderboardData.length === 0) {
        return (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                <p style={{ color: 'var(--text-dim)' }}>No data available for leaderboard yet.</p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-trophy" style={{ color: '#FFD700' }}></i>
                    Overall Standings
                </h2>
                <button className="btn btn-primary" onClick={downloadLeaderboard}>
                    <i className="fas fa-download" style={{ marginRight: '8px' }}></i> DOWNLOAD AS IMAGE
                </button>
            </div>

            <div ref={leaderboardRef} style={{ 
                background: '#0a0a0a', 
                padding: '30px', 
                borderRadius: '24px', 
                border: '2px solid var(--primary)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Branding / Header in Image */}
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(0,255,156,0.1)', paddingBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {tournamentName || 'ARENA HUB'} <span style={{ color: 'var(--primary)' }}>TOURNAMENT</span>
                    </h1>
                    <p style={{ color: 'var(--text-dim)', margin: '5px 0 0 0', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '4px' }}>
                        Overall Points Table
                    </p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,255,156,0.1)', color: 'var(--primary)' }}>
                                <th style={{ padding: '15px', textAlign: 'left', borderRadius: '12px 0 0 12px' }}>RANK</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>SQUAD NAME</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>KILLS</th>
                                <th style={{ padding: '15px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>POINTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboardData.map((team, idx) => (
                                <tr key={team.id} style={{ 
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: idx < 3 ? `rgba(0,255,156,${0.05 - idx * 0.01})` : 'transparent'
                                }}>
                                    <td style={{ padding: '20px 15px', fontWeight: 900 }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: idx === 0 ? '#FFD700' : (idx === 1 ? '#C0C0C0' : (idx === 2 ? '#CD7F32' : 'transparent')),
                                            color: idx < 3 ? '#000' : '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: idx >= 3 ? '1px solid var(--border)' : 'none'
                                        }}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {team.squad_logo_url && (
                                                <img src={team.squad_logo_url} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                            )}
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{team.squad_name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 15px', textAlign: 'center', fontWeight: 600, color: 'var(--text-dim)' }}>
                                        {team.totalKills}
                                    </td>
                                    <td style={{ padding: '20px 15px', textAlign: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>
                                        {team.totalPoints}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px' }}>
                        GENERATED BY <span style={{ color: 'var(--primary)', fontWeight: 800 }}>ARENA HUB</span> • {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PointsLeaderboard;
