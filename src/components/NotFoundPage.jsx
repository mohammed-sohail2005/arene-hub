import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px', textAlign: 'center'
        }}>
            <div className="glass" style={{
                padding: '60px 40px', borderRadius: '24px', maxWidth: '500px', width: '100%',
                border: '1px solid rgba(0,255,156,0.15)',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,255,156,0.03))',
            }}>
                {/* Glitch-style 404 */}
                <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 'clamp(4rem, 15vw, 8rem)',
                    fontWeight: 900, lineHeight: 1, marginBottom: '16px',
                    background: 'linear-gradient(135deg, #fff 0%, var(--primary) 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textShadow: 'none'
                }}>
                    404
                </div>

                <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', letterSpacing: '3px' }}>
                    PAGE <span style={{ color: 'var(--primary)' }}>NOT FOUND</span>
                </h2>

                <p style={{
                    color: 'var(--text-dim)', fontSize: '0.9rem',
                    marginBottom: '32px', maxWidth: '350px', margin: '0 auto 32px'
                }}>
                    Looks like you wandered off the battleground. This page doesn't exist.
                </p>

                <button
                    className="btn btn-primary"
                    style={{ padding: '14px 32px', fontSize: '0.9rem', fontWeight: 800 }}
                    onClick={() => navigate('/')}
                >
                    <i className="fas fa-home" style={{ marginRight: '8px' }}></i>
                    BACK TO HOME
                </button>

                <div style={{ marginTop: '24px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    <i className="fas fa-gamepad" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                    Arena Hub
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
