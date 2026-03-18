import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setFadeOut(true), 300);
                    setTimeout(() => onFinish(), 1200);
                    return 100;
                }
                // Accelerate towards end
                const step = prev < 60 ? 3 : prev < 85 ? 2 : 1;
                return Math.min(prev + step, 100);
            });
        }, 40);

        return () => clearInterval(interval);
    }, [onFinish]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#0A0C10', zIndex: 100000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            opacity: fadeOut ? 0 : 1,
            transform: fadeOut ? 'scale(1.05)' : 'scale(1)',
        }}>
            {/* Background effects */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(0,255,156,0.12) 0%, transparent 70%)',
                animation: 'splashPulse 2s ease-in-out infinite',
            }}></div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: `${4 + i * 2}px`, height: `${4 + i * 2}px`,
                    borderRadius: '50%',
                    background: 'rgba(0,255,156,0.3)',
                    top: `${20 + i * 12}%`,
                    left: `${15 + i * 13}%`,
                    animation: `splashFloat ${3 + i * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                }}></div>
            ))}

            {/* Logo */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    overflow: 'hidden', border: '3px solid var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#000',
                    animation: 'splashLogoGlow 2s ease-in-out infinite',
                }}>
                    <img src="/logo.jpg" alt="Arena Hub Logo" style={{ width: '120%', height: '120%', objectFit: 'cover' }} />
                </div>
            </div>

            {/* Brand Name */}
            <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '3rem', fontWeight: 900,
                letterSpacing: '4px', marginBottom: '8px',
                animation: 'splashTextIn 0.8s ease-out',
            }}>
                ARENA<span style={{ color: '#00FF9C' }}>HUB</span>
            </div>

            {/* Tagline */}
            <div style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem', fontWeight: 600,
                letterSpacing: '4px', textTransform: 'uppercase',
                marginBottom: '50px',
                animation: 'splashTextIn 0.8s ease-out 0.2s both',
            }}>
                Dominate The Battleground
            </div>

            {/* Progress bar */}
            <div style={{
                width: '240px', height: '3px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px', overflow: 'hidden',
                marginBottom: '16px',
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00FF9C, #00cc7a)',
                    borderRadius: '4px',
                    transition: 'width 0.15s ease',
                    boxShadow: '0 0 12px rgba(0,255,156,0.5)',
                }}></div>
            </div>

            {/* Loading text */}
            <div style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '0.65rem', fontWeight: 600,
                letterSpacing: '3px', textTransform: 'uppercase',
            }}>
                {progress < 30 ? 'Initializing...' :
                    progress < 60 ? 'Loading Assets...' :
                        progress < 90 ? 'Preparing Arena...' :
                            'Ready!'}
            </div>

            {/* Animations */}
            <style>{`
                @keyframes splashPulse {
                    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
                }
                @keyframes splashFloat {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
                }
                @keyframes splashLogoGlow {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(0,255,156,0.3)); }
                    50% { filter: drop-shadow(0 0 24px rgba(0,255,156,0.6)); }
                }
                @keyframes splashTextIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
