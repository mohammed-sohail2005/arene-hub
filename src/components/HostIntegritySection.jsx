import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const HostIntegritySection = () => {
    const [hostGroups, setHostGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHost, setSelectedHost] = useState(null);

    useEffect(() => {
        const fetchAndGroupProofs = async () => {
            try {
                const { data, error } = await supabase
                    .from('host_proofs')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by UPI ID
                const grouped = (data || []).reduce((acc, current) => {
                    const upi = current.upi_id || 'Verified Host';
                    if (!acc[upi]) {
                        acc[upi] = {
                            upi_id: upi,
                            total_payouts: 0,
                            latest_payout: current.created_at,
                            proofs: []
                        };
                    }
                    acc[upi].total_payouts += 1;
                    acc[upi].proofs.push(current);
                    return acc;
                }, {});

                // Convert to array and sort by total payouts (reputation)
                const sortedGroups = Object.values(grouped).sort((a, b) => b.total_payouts - a.total_payouts);
                setHostGroups(sortedGroups);
            } catch (err) {
                console.error("Error fetching host proofs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndGroupProofs();

        const channel = supabase
            .channel('public:host_proofs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'host_proofs' },
                () => {
                    fetchAndGroupProofs(); // Re-fetch to update groupings
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <i className="fas fa-shield-alt fa-pulse" style={{ fontSize: '2rem', color: 'var(--primary)', opacity: 0.5 }}></i>
            </div>
        );
    }

    if (hostGroups.length === 0) {
        return null;
    }

    return (
        <section id="host-integrity" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Host Proofs Gallery Viewer */}
            {selectedHost && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.95)', zIndex: 9999,
                        display: 'flex', flexDirection: 'column',
                        padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div>
                                <h2 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>
                                    <i className="fas fa-history"></i> Payout History
                                </h2>
                                <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>
                                    {selectedHost.upi_id}
                                </p>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                    {selectedHost.total_payouts} Verified Tournaments
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedHost(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)',
                                    color: '#fff', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-times"></i> CLOSE
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                            {selectedHost.proofs.map((proof, idx) => (
                                <div key={idx} className="glass" style={{ padding: '15px', borderRadius: '16px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                            {new Date(proof.created_at).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{proof.tournament_name}</div>
                                    </div>
                                    <img
                                        src={proof.screenshot_url}
                                        alt="Payout Proof"
                                        style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border)' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(0,255,156,0.1)', padding: '6px 16px', borderRadius: '20px', marginBottom: '16px', border: '1px solid rgba(0,255,156,0.2)' }}>
                    <i className="fas fa-chart-line" style={{ color: 'var(--primary)' }}></i>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>HOST REPUTATION SCALE</span>
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>HOST <span style={{ color: 'var(--primary)' }}>INTEGRITY</span></h2>
                <p style={{ color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto' }}>
                    Real Players. Real Prizes. Real Proof. We combine individual payouts into a verified history for every organizer, so you can compete with 100% confidence.
                </p>
            </div>

            <div className="grid-mobile-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                {hostGroups.map((group, idx) => (
                    <div
                        key={idx}
                        className="glass hover-glow"
                        onClick={() => setSelectedHost(group)}
                        style={{
                            padding: '30px', borderRadius: '20px', border: '1px solid rgba(0,255,156,0.1)',
                            cursor: 'pointer', position: 'relative', overflow: 'hidden',
                            transition: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', fontSize: '3rem', color: 'var(--primary)', opacity: 0.05 }}>
                            <i className="fas fa-shield-check"></i>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <span style={{ background: 'rgba(0,255,156,0.1)', color: '#00ff9c', border: '1px solid rgba(0,255,156,0.3)', padding: '4px 12px', fontSize: '0.7rem', borderRadius: '20px', fontWeight: 800 }}>
                                <i className="fas fa-certificate" style={{ marginRight: '6px' }}></i>
                                VERIFIED HOST
                            </span>
                        </div>

                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff', wordBreak: 'break-all' }}>
                            {group.upi_id}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{group.total_payouts}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Verified Payouts</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: 'var(--border)' }}></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#fff' }}>{new Date(group.latest_payout).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Latest Activity</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                            VIEW HISTORY <i className="fas fa-arrow-right"></i>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HostIntegritySection;
