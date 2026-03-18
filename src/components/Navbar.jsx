import React from 'react';

const Navbar = ({ onHostClick, onHostPageClick, onTeamPortalClick }) => {
    return (
        <header className="glass" style={{
            position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none'
        }}>
            <nav style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem' }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                        <img src="/logo.jpg" alt="Arena Hub Logo" style={{ width: '120%', height: '120%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>ARENA<span style={{ color: 'var(--primary)' }}>HUB</span></span>
                </div>

                <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#tournaments" onClick={(e) => { e.preventDefault(); document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>Tournaments</a>
                    <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>About</a>
                    <a href="#leaderboard" onClick={(e) => { e.preventDefault(); document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>Leaderboard</a>
                </div>

                <div className="nav-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={onHostClick}>+ HOST</button>
                    <button className="btn btn-outline" onClick={onHostPageClick} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>⚡ MULTI</button>
                    <button className="btn btn-outline" onClick={onTeamPortalClick} style={{ borderColor: '#4da6ff', color: '#4da6ff' }}>🎮 TEAM</button>
                </div>
            </nav>
        </header >
    );
};

export default Navbar;
