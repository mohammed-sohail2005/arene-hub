import React from 'react';

const ContactSection = () => {
    const email = 'arenahubx321@gmail.com';

    return (
        <section id="contact" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass" style={{
                padding: '50px 40px', borderRadius: '24px', textAlign: 'center',
                border: '1px solid rgba(0,255,156,0.15)',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,255,156,0.03))',
            }}>
                {/* Icon */}
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', margin: '0 auto 24px',
                    background: 'rgba(0,255,156,0.08)', border: '2px solid var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <i className="fas fa-envelope" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}></i>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>
                    CONTACT <span style={{ color: 'var(--primary)' }}>US</span>
                </h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '30px', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 30px' }}>
                    Facing issues with hosting or joining a tournament? We're here to help! Reach out and we'll sort it out.
                </p>

                {/* Gmail Link */}
                <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '12px',
                        padding: '16px 32px', borderRadius: '12px',
                        background: 'rgba(0,255,156,0.08)', border: '1px solid var(--primary)',
                        color: 'var(--primary)', textDecoration: 'none', fontWeight: 700,
                        fontSize: '1rem', transition: 'all 0.3s ease',
                    }}
                >
                    {/* Gmail SVG Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    SEND US AN EMAIL
                </a>

                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '20px' }}>
                    <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                    We typically respond within 24 hours
                </p>
            </div>
        </section>
    );
};

export default ContactSection;
