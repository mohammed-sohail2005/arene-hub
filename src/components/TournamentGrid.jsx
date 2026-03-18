import React from 'react';

const TOURNAMENTS = [
    { id: 1, title: "BGMI PRO LEAGUE S1", game: "BGMI", status: "LIVE", prize: "₹2.5L", players: "100", date: "Feb 15", slots: 0 },
    { id: 2, title: "FF WORLD SERIES", game: "FREE FIRE", status: "UPCOMING", prize: "₹1.2L", players: "50", date: "Mar 02", slots: 12 },
    { id: 3, title: "SQUAD SHOWDOWN WEEKLY", game: "BGMI", status: "OPEN", prize: "₹50K", players: "64", date: "Feb 20", slots: 16 }
];

const TournamentGrid = () => {
    return (
        <section id="tournaments" style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>FEATURED <span style={{ color: 'var(--primary)' }}>TOURNAMENTS</span></h2>
                <p style={{ color: 'var(--text-dim)' }}>Pick your battle. Register now before slots fill up.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                {TOURNAMENTS.map(t => (
                    <div key={t.id} className="glass card hover-glow" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div className={`badge ${t.status === 'LIVE' ? 'badge-live' : (t.status === 'UPCOMING' ? 'badge-upcoming' : 'badge-open')}`}>
                                {t.status === 'LIVE' && <span className="pulse"></span>} {t.status}
                            </div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{t.date}</div>
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', letterSpacing: '1px' }}>{t.title}</h3>
                        <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '24px' }}>{t.game}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Prize Pool</div><div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t.prize}</div></div>
                            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Players</div><div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t.players}</div></div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>{t.status === 'LIVE' ? 'WATCH NOW' : 'REGISTER NOW'}</button>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TournamentGrid;
