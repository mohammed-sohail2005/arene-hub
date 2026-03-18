import React, { useState, useEffect } from 'react';
import RegisterModal from './RegisterModal';
import HostHistoryModal from './HostHistoryModal';
import { supabase } from '../lib/supabase';

const TournamentDetails = ({ tournament, onBack }) => {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isHostHistoryOpen, setIsHostHistoryOpen] = useState(false);
    const [hostTournamentCount, setHostTournamentCount] = useState(0);
    const [registeredSquads, setRegisteredSquads] = useState(0);
    const [maxSquads, setMaxSquads] = useState(25);
    const [hostProofs, setHostProofs] = useState([]);
    const [viewingProof, setViewingProof] = useState(null);

    useEffect(() => {
        if (tournament?.upi_id) {
            fetchHostCount();
        }
        if (tournament?.host_code) {
            fetchSquadCount();
        }
        if (tournament?.upi_id) {
            fetchHostProofs();
        }
    }, [tournament]);

    const fetchHostCount = async () => {
        try {
            const { count, error } = await supabase
                .from('tournaments')
                .select('*', { count: 'exact', head: true })
                .eq('upi_id', tournament.upi_id);

            if (!error && count !== null) {
                setHostTournamentCount(count);
            }
        } catch (err) {
            console.error('Error fetching host count:', err);
            setHostTournamentCount(3); // Mock fallback
        }
    };

    const fetchSquadCount = async () => {
        try {
            const baseMaxTeams = tournament.max_teams || Math.floor((tournament.max_players || 100) / 4);
            const totalMaxTeams = baseMaxTeams * (tournament.num_qualifiers || 1);
            setMaxSquads(totalMaxTeams);
            const { count, error } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('host_code', tournament.host_code);
            if (!error && count !== null) {
                setRegisteredSquads(count);
            }
        } catch (err) {
            console.error('Error fetching squad count:', err);
        }
    };

    const fetchHostProofs = async () => {
        try {
            const { data, error } = await supabase
                .from('host_proofs')
                .select('*')
                .eq('upi_id', tournament.upi_id)
                .order('created_at', { ascending: false });
            if (!error) setHostProofs(data || []);
        } catch (err) {
            console.error('Error fetching host proofs:', err);
        }
    };

    if (!tournament) return null;

    const trustLevel = hostTournamentCount >= 10 ? 'Veteran' : hostTournamentCount >= 5 ? 'Trusted' : hostTournamentCount >= 2 ? 'Active' : 'New';
    const trustColor = hostTournamentCount >= 10 ? '#FFD700' : hostTournamentCount >= 5 ? '#00ff9c' : hostTournamentCount >= 2 ? '#4da6ff' : 'var(--text-dim)';

    return (
        <div className="page-container" style={{ maxWidth: '1200px' }}>
            {/* Back Button */}
            <button
                onClick={onBack}
                className="btn btn-outline"
                style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}
            >
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO TOURNAMENTS
            </button>

            {/* Header / Banner Area */}
            <div className="wrap-mobile" style={{ alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    {tournament.photo_url ? (
                        <img src={tournament.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-gamepad" style={{ fontSize: '2.5rem', color: 'var(--primary)', opacity: 0.5 }}></i>
                        </div>
                    )}
                </div>
                <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: 'var(--primary)', color: '#000' }}>{tournament.game?.toUpperCase()}</span>
                        {tournament.maps?.length > 1 ? tournament.maps.map((m, i) => (
                            <span key={i} className="badge" style={{ border: '1px solid #fff', color: '#fff' }}>{m}</span>
                        )) : (
                            <span className="badge" style={{ border: '1px solid #fff', color: '#fff' }}>{tournament.map}</span>
                        )}
                        {tournament.match_count > 1 && (
                            <span className="badge" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
                                <i className="fas fa-layer-group" style={{ marginRight: '4px' }}></i>{tournament.match_count} Matches
                            </span>
                        )}
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', margin: 0, lineHeight: 1.1 }}>{tournament.tournament_name}</h1>
                    <p style={{ color: 'var(--text-dim)', margin: '8px 0 0 0' }}>Hosted by <span style={{ color: '#fff' }}>{tournament.owner_name}</span></p>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid-stats" style={{ marginBottom: '40px' }}>
                <div className="glass" style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <i className="fas fa-trophy" style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '12px' }}></i>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>₹{tournament.prize_pool || 0}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Prize Pool</div>
                </div>
                <div className="glass" style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <i className="far fa-calendar-alt" style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '12px' }}></i>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{tournament.date || 'TBD'}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Match Date</div>
                </div>
                <div className="glass" style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <i className="far fa-clock" style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '12px' }}></i>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {tournament.match_count > 1 ? `${tournament.first_start_time || 'TBD'} - ${tournament.last_start_time || 'TBD'}` : (tournament.start_time || 'TBD')}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Match Time</div>
                </div>
                {tournament.match_count > 1 && (
                    <div className="glass" style={{ padding: '24px 16px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)' }}>
                        <i className="fas fa-layer-group" style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '12px' }}></i>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFD700' }}>{tournament.match_count}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Matches</div>
                    </div>
                )}
                <div className="glass" style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <i className="fas fa-wallet" style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '12px' }}></i>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tournament.upi_id || 'example@upi'}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>UPI ID</div>
                </div>
            </div>

            {/* Info Sections Grid */}
            <div className="grid-mobile-col" style={{ gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                {/* Match Info */}
                <div className="glass" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <i className="fas fa-gamepad" style={{ color: 'var(--primary)' }}></i>
                        <h3 style={{ margin: 0 }}>Match Info</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Room Opens</span>
                            <span>{tournament.room_time || '15:04'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Max Players</span>
                            <span>{tournament.max_players}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Entry Fee</span>
                            <span>{tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <i className="fas fa-bullseye" style={{ color: 'var(--primary)' }}></i>
                        <h3 style={{ margin: 0 }}>Additional Info</h3>
                    </div>
                    <div style={{ marginBottom: tournament.rules ? '20px' : '0' }}>
                        <a
                            href={tournament.youtube_link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#ff4d4d', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <i className="fab fa-youtube"></i> Watch on YouTube
                        </a>
                    </div>
                    {tournament.rules && (
                        <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', flex: 1 }}>
                            <h4 style={{ color: 'var(--text-dim)', margin: '0 0 12px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Match Description / Details</h4>
                            <div style={{ margin: 0, fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: '1.6', wordBreak: 'break-word', opacity: 0.9 }}>
                                {tournament.rules}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Match Schedule Section (for multi-match tournaments) */}
            {tournament.matches && tournament.matches.length > 1 && (
                <div className="glass" style={{ padding: '30px', marginBottom: '40px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <i className="fas fa-layer-group" style={{ color: '#FFD700' }}></i>
                        <h3 style={{ margin: 0 }}>Match <span style={{ color: '#FFD700' }}>Schedule</span></h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>Register once, play all {tournament.matches.length} matches</span>
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {tournament.matches.map((match, idx) => (
                            <div key={match.id || idx} style={{
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                                borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border)', justifyContent: 'space-between',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 900, fontSize: '0.9rem', color: '#FFD700', flexShrink: 0,
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                            {match.stage ? match.stage.toUpperCase() : `Match ${idx + 1}`}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{match.map || 'TBD'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
                                    <div style={{ color: 'var(--text-dim)' }}>
                                        <i className="far fa-clock" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                                        {match.start_time || 'TBD'}
                                    </div>
                                    {match.is_staged && (
                                        <div style={{ 
                                            background: 'rgba(0,255,156,0.1)', color: '#00ff9c',
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800
                                        }}>
                                            STAGED
                                        </div>
                                    )}
                                    <div style={{ color: 'var(--text-dim)' }}>
                                        <i className="fas fa-door-open" style={{ marginRight: '6px', color: '#FFD700' }}></i>
                                        Room: {match.room_time || 'TBD'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Host Integrity Section */}
            <div className="glass" style={{
                padding: '30px', marginBottom: '30px', borderRadius: '20px',
                border: `1px solid ${trustColor}`,
                background: `linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,255,156,0.03))`,
            }}>
                <div className="wrap-mobile" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '50%',
                            background: `${trustColor}15`, border: `2px solid ${trustColor}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <i className="fas fa-shield-alt" style={{ color: trustColor, fontSize: '1.2rem' }}></i>
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Host Integrity</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    padding: '3px 12px', borderRadius: '12px', fontSize: '0.7rem',
                                    fontWeight: 800, textTransform: 'uppercase',
                                    background: `${trustColor}20`, color: trustColor, border: `1px solid ${trustColor}`,
                                }}>
                                    {trustLevel}
                                </span>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                    {hostTournamentCount} Tournament{hostTournamentCount !== 1 ? 's' : ''} Hosted
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        className="btn btn-outline"
                        style={{ padding: '8px 20px', fontSize: '0.75rem', borderColor: trustColor, color: trustColor }}
                        onClick={() => setIsHostHistoryOpen(true)}
                    >
                        VIEW HOST HISTORY
                    </button>
                </div>
            </div>

            {/* Squad Capacity */}
            <div style={{
                padding: '16px 20px', marginBottom: '20px', borderRadius: '12px',
                background: registeredSquads >= maxSquads ? 'rgba(255,77,77,0.08)' : 'rgba(0,255,156,0.05)',
                border: `1px solid ${registeredSquads >= maxSquads ? 'rgba(255,77,77,0.3)' : 'rgba(0,255,156,0.15)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-user-friends" style={{ color: registeredSquads >= maxSquads ? '#ff4d4d' : 'var(--primary)' }}></i>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Squad Slots</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: registeredSquads >= maxSquads ? '#ff4d4d' : 'var(--primary)' }}>
                    {registeredSquads}/{maxSquads}
                </span>
            </div>

            {/* Register Button */}
            {registeredSquads >= maxSquads ? (
                <div style={{
                    width: '100%', padding: '20px', fontSize: '1.2rem', fontWeight: 800,
                    textAlign: 'center', background: 'rgba(255,77,77,0.1)',
                    border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', color: '#ff4d4d',
                }}>
                    <i className="fas fa-ban" style={{ marginRight: '12px' }}></i>TOURNAMENT FULL
                </div>
            ) : (
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '20px', fontSize: '1.2rem', fontWeight: 800 }}
                    onClick={() => setIsRegisterModalOpen(true)}
                >
                    <i className="fas fa-user-friends" style={{ marginRight: '12px' }}></i> REGISTER YOUR SQUAD
                </button>
            )}

            {/* Host Integrity - Verified Payouts by this host */}
            {hostProofs.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>HOST <span style={{ color: 'var(--primary)' }}>INTEGRITY</span></h3>
                        <span style={{ background: 'rgba(0,255,156,0.15)', color: '#00ff9c', padding: '2px 10px', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 800 }}>
                            {hostProofs.length} VERIFIED
                        </span>
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {hostProofs.map((proof) => (
                            <div key={proof.id} className="glass" style={{
                                padding: '16px', borderRadius: '14px',
                                border: '1px solid rgba(0,255,156,0.1)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                flexWrap: 'wrap', gap: '12px',
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ background: 'rgba(0,255,156,0.15)', color: '#00ff9c', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 800 }}>
                                            ✓ VERIFIED
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                            {new Date(proof.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{proof.tournament_name}</h4>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '6px 14px', fontSize: '0.7rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                    onClick={() => setViewingProof(proof)}
                                >
                                    <i className="fas fa-image" style={{ marginRight: '5px' }}></i>VIEW PROOF
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full Screen Proof Viewer */}
            {viewingProof && (
                <div
                    onClick={() => setViewingProof(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.92)', zIndex: 9999,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '20px', cursor: 'pointer', backdropFilter: 'blur(5px)',
                    }}
                >
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 6px 0', color: 'var(--primary)' }}><i className="fas fa-check-circle"></i> Verified Payout</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>{viewingProof.tournament_name}</p>
                    </div>
                    <img
                        src={viewingProof.screenshot_url}
                        alt="Prize Proof"
                        style={{ maxWidth: '90%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px', border: '2px solid var(--primary)' }}
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setViewingProof(null)}
                        style={{ marginTop: '24px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', color: '#fff', padding: '10px 30px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-times" style={{ marginRight: '6px' }}></i>Close
                    </button>
                </div>
            )}
            {/* Modals */}
            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                tournament={tournament}
            />
            <HostHistoryModal
                isOpen={isHostHistoryOpen}
                onClose={() => setIsHostHistoryOpen(false)}
                upiId={tournament.upi_id}
                hostName={tournament.owner_name}
            />
        </div>
    );
};

export default TournamentDetails;
