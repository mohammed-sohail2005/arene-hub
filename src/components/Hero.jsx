import React from 'react';

const Hero = ({ onHostClick, onMultiClick }) => {
    return (
        <section className="hero" style={{ padding: '100px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', opacity: 0.15, zIndex: -1 }}></div>

            <div className="badge badge-open" style={{ display: 'inline-block', marginBottom: '24px' }}>⚡ SEASON 4 LIVE NOW</div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 1, marginBottom: '24px' }}>DOMINATE THE <br /> <span className="text-gradient">BATTLEGROUND</span></h1>
            <p style={{ color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto 40px', fontSize: '1.1rem' }}>The ultimate home for mobile eSports. Join India's fastest-growing competitive platform for BGMI, Free Fire, and CODM tournaments with instant payouts and full transparency.</p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '60px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ padding: '18px 36px', fontSize: '1rem' }} onClick={() => document.getElementById('tournaments').scrollIntoView({ behavior: 'smooth' })}>JOIN TOURNAMENT</button>
                <button className="btn btn-outline" style={{ padding: '18px 36px', fontSize: '1rem' }} onClick={onHostClick}>HOST A MATCH</button>
                <button className="btn btn-primary" style={{ padding: '18px 36px', fontSize: '1rem', background: 'linear-gradient(135deg, #00ff9c, #00cc7a)', color: '#000', fontWeight: 800 }} onClick={onMultiClick}>
                    <i className="fas fa-bolt" style={{ marginRight: '8px' }}></i>MULTI HOST
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="glass" style={{ padding: '40px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '4px' }}>₹50L+</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Prize Pool</div>
                </div>
                <div className="glass" style={{ padding: '40px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '4px' }}>25K+</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Active Players</div>
                </div>
                <div className="glass" style={{ padding: '40px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="m13 2-2 10h11L11 22l2-10H2Z" /></svg>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '4px' }}>100+</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Daily Matches</div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
