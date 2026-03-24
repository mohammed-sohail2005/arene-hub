import React from 'react';

const AboutSection = () => {
    const features = [
        {
            icon: 'fas fa-trophy',
            title: 'Host Tournaments',
            desc: 'Create single or multi-match tournaments with custom maps, entry fees, and prize pools. Get a unique host code to manage everything.',
        },
        {
            icon: 'fas fa-users',
            title: 'Squad Registration',
            desc: 'Register your squad with player details, upload payment proof, and get a team code to track room details and match info.',
        },
        {
            icon: 'fas fa-key',
            title: 'Room Management',
            desc: 'Hosts can set room IDs and passwords per match. Registered players instantly see updated details via their team portal.',
        },
        {
            icon: 'fas fa-shield-alt',
            title: 'Payment Verification',
            desc: 'Screenshot-based payment verification ensures transparency. Hosts can view and verify every payment before the match.',
        },
        {
            icon: 'fas fa-bolt',
            title: 'Real-Time Updates',
            desc: 'Powered by Supabase for instant data sync. Tournament listings, registrations, and room details update in real-time.',
        },
        {
            icon: 'fas fa-gamepad',
            title: 'Multi-Game Support',
            desc: 'Supports BGMI, Free Fire, and COD Mobile with game-specific maps, formats (Solo, Duo, Squad), and custom rules.',
        },
    ];

    const stats = [
        { value: 'BGMI', label: 'Supported' },
        { value: 'Free Fire', label: 'Supported' },
        { value: 'COD Mobile', label: 'Supported' },
        { value: '∞', label: 'Tournaments' },
    ];

    return (
        <section id="about" style={{ padding: '100px 20px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <div style={{
                    display: 'inline-block', padding: '6px 20px', borderRadius: '20px',
                    background: 'rgba(0,255,156,0.08)', border: '1px solid rgba(0,255,156,0.2)',
                    fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)',
                    textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px',
                }}>
                    About Us
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', lineHeight: 1.2 }}>
                    THE ULTIMATE <span style={{ color: 'var(--primary)' }}>ESPORTS</span> PLATFORM
                </h2>
                <p style={{ color: 'var(--text-dim)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    Arena Hub is India's premier gateway to mobile eSports. Turn your skills into cold hard cash and join 25,000+ warriors competing for glory and guaranteed prize pools.
                </p>
            </div>

            {/* Mission Card */}
            <div className="glass" style={{
                padding: '40px', borderRadius: '24px', marginBottom: '50px',
                border: '1px solid var(--primary)',
                background: 'linear-gradient(135deg, rgba(0,255,156,0.06) 0%, rgba(0,0,0,0) 70%)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-40px', right: '-40px',
                    width: '200px', height: '200px',
                    background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.08,
                }}></div>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '70px', height: '70px', borderRadius: '20px',
                        background: 'rgba(0,255,156,0.1)', border: '1px solid rgba(0,255,156,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <i className="fas fa-crosshairs" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>
                            OUR <span style={{ color: 'var(--primary)' }}>MISSION</span>
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                            To lead the future of mobile eSports by giving every gamer — from casual squads to professional clans —
                            the stage they deserve. No middlemen, no complex setups. Just pure competition and instant rewards.
                        </p>
                    </div>
                </div>
            </div>

            {/* Game Support Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '50px' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass" style={{
                        padding: '24px', textAlign: 'center', borderRadius: '16px',
                        border: '1px solid var(--border)', transition: '0.3s',
                    }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '6px' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Features Grid */}
            <div style={{ marginBottom: '50px' }}>
                <h3 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '30px' }}>
                    WHAT WE <span style={{ color: 'var(--primary)' }}>OFFER</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {features.map((f, i) => (
                        <div key={i} className="glass hover-glow" style={{
                            padding: '30px', borderRadius: '18px',
                            border: '1px solid var(--border)', transition: '0.3s',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: 'rgba(0,255,156,0.08)', border: '1px solid rgba(0,255,156,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '18px',
                            }}>
                                <i className={f.icon} style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                            </div>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800 }}>{f.title}</h4>
                            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="glass" style={{
                padding: '40px', borderRadius: '24px', border: '1px solid var(--border)',
            }}>
                <h3 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '30px' }}>
                    HOW IT <span style={{ color: 'var(--primary)' }}>WORKS</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    {[
                        { step: '01', icon: 'fas fa-plus-circle', title: 'Create', desc: 'Host a tournament with your custom settings' },
                        { step: '02', icon: 'fas fa-share-alt', title: 'Share', desc: 'Share the tournament for players to join' },
                        { step: '03', icon: 'fas fa-user-check', title: 'Register', desc: 'Players register with squad details & pay' },
                        { step: '04', icon: 'fas fa-play-circle', title: 'Compete', desc: 'Set room details and let the battle begin' },
                    ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                fontSize: '2.5rem', fontWeight: 900,
                                color: 'rgba(0,255,156,0.08)', position: 'absolute',
                                top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                fontFamily: 'monospace',
                            }}>{s.step}</div>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'rgba(0,255,156,0.1)', border: '2px solid var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '10px auto 14px',
                            }}>
                                <i className={s.icon} style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>
                            </div>
                            <h5 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: 800 }}>{s.title}</h5>
                            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', lineHeight: 1.5 }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tech Footer */}
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    Made with <i className="fas fa-heart" style={{ color: '#ff4d4d', fontSize: '0.7rem' }}></i> for the gaming community
                </p>
            </div>
        </section>
    );
};

export default AboutSection;
