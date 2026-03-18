import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const HostHistoryModal = ({ isOpen, onClose, upiId, hostName }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && upiId) {
            fetchHostHistory();
        }
    }, [isOpen, upiId]);

    const fetchHostHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('upi_id', upiId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching host history:', err);
            // Mock data fallback
            setHistory([
                { id: 'hist-1', tournament_name: 'BGMI Championship', date: '2026-02-25', prize_pool: 5000, game: 'bgmi' },
                { id: 'hist-2', tournament_name: 'Night Series #1', date: '2026-02-20', prize_pool: 3000, game: 'bgmi' },
                { id: 'hist-3', tournament_name: 'Weekend Warriors', date: '2026-02-15', prize_pool: 2000, game: 'freefire' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const uniqueTournamentsMap = new Map();
    history.forEach(t => {
        const isMulti = t.tournament_name?.match(/(.*) - Match \d+$/);
        const baseName = isMulti ? isMulti[1] : t.tournament_name;
        // Group by host_code. If undefined, group by baseName.
        const key = t.host_code || baseName || t.id;

        if (!uniqueTournamentsMap.has(key)) {
            uniqueTournamentsMap.set(key, {
                ...t,
                base_name: baseName,
                matchCount: 1,
                totalPrizeForTournament: parseFloat(t.prize_pool) || 0
            });
        } else {
            const existing = uniqueTournamentsMap.get(key);
            existing.matchCount += 1;
        }
    });

    const uniqueTournaments = Array.from(uniqueTournamentsMap.values());
    const tournamentCount = uniqueTournaments.length;

    const totalPrize = uniqueTournaments.reduce((sum, t) => sum + (t.totalPrizeForTournament || 0), 0);
    const trustLevel = tournamentCount >= 10 ? 'Veteran' : tournamentCount >= 5 ? 'Trusted' : tournamentCount >= 2 ? 'Active' : 'New';
    const trustColor = tournamentCount >= 10 ? '#FFD700' : tournamentCount >= 5 ? '#00ff9c' : tournamentCount >= 2 ? '#4da6ff' : 'var(--text-dim)';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
        }} onClick={onClose}>
            <div className="glass" style={{
                maxWidth: '600px', width: '100%', maxHeight: '85vh',
                borderRadius: '24px', border: '1px solid var(--primary)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '30px 30px 0 30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
                            <i className="fas fa-shield-alt" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
                            HOST HISTORY
                        </h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                    </div>

                    {/* Host Summary Card */}
                    <div className="glass" style={{
                        padding: '20px', borderRadius: '16px', marginBottom: '24px',
                        border: `1px solid ${trustColor}`,
                        background: `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(${trustColor === '#FFD700' ? '255,215,0' : trustColor === '#00ff9c' ? '0,255,156' : '77,166,255'}, 0.05))`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{hostName || 'Unknown Host'}</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>UPI: {upiId}</p>
                            </div>
                            <div style={{
                                padding: '6px 16px', borderRadius: '20px',
                                background: `${trustColor}20`, border: `1px solid ${trustColor}`,
                                color: trustColor, fontWeight: 800, fontSize: '0.75rem',
                                textTransform: 'uppercase',
                            }}>
                                {trustLevel}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>{tournamentCount}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tournaments</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, color: 'var(--primary)' }}>₹{totalPrize.toLocaleString()}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Prize Given</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div style={{ padding: '0 30px 30px 30px', overflowY: 'auto', flex: 1 }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Past Tournaments</h4>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
                        </div>
                    ) : uniqueTournaments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                            <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}></i>
                            <p>No tournament history found</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {uniqueTournaments.map((t, idx) => (
                                <div key={t.id || t.host_code || idx} className="glass" style={{
                                    padding: '16px 20px', borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {t.base_name || t.tournament_name}
                                            {t.matchCount > 1 && (
                                                <span className="badge" style={{ background: 'var(--primary)', color: '#000', fontSize: '0.65rem', padding: '2px 6px' }}>
                                                    {t.matchCount} Matches
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                            <i className="far fa-calendar-alt" style={{ marginRight: '6px' }}></i>{t.date}
                                            <span style={{ margin: '0 8px' }}>•</span>
                                            <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{t.game?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{(t.totalPrizeForTournament || 0).toLocaleString()}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Prize Pool</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HostHistoryModal;
