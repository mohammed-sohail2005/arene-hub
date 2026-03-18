import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        if (duration > 0) {
            timersRef.current[id] = setTimeout(() => removeToast(id), duration);
        }
        return id;
    }, [removeToast]);

    const toast = useMemo(() => {
        const fn = (msg, type, dur) => addToast(msg, type, dur);
        fn.success = (msg, dur) => addToast(msg, 'success', dur);
        fn.error = (msg, dur) => addToast(msg, 'error', dur || 6000);
        fn.info = (msg, dur) => addToast(msg, 'info', dur);
        fn.warning = (msg, dur) => addToast(msg, 'warning', dur || 5000);
        fn.copied = (msg) => addToast(msg || 'Copied!', 'success', 2000);
        return fn;
    }, [addToast]);

    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle',
    };

    const colorMap = {
        success: '#00ff9c',
        error: '#ff4d4d',
        info: '#4da6ff',
        warning: '#FFC107',
    };

    const bgMap = {
        success: 'rgba(0,255,156,0.12)',
        error: 'rgba(255,77,77,0.12)',
        info: 'rgba(77,166,255,0.12)',
        warning: 'rgba(255,193,7,0.12)',
    };

    const borderMap = {
        success: 'rgba(0,255,156,0.3)',
        error: 'rgba(255,77,77,0.3)',
        info: 'rgba(77,166,255,0.3)',
        warning: 'rgba(255,193,7,0.3)',
    };

    const extractCode = (line) => {
        // Match patterns like "Team Code: 123456" or "Host Code is: 654321"
        const match = line.match(/(?:Team Code|Host Code)[^:]*:\s*(\d{6})/i);
        return match ? match[1] : null;
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Backdrop + Centered Toast Container */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 99998, background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                }} onClick={() => removeToast(toasts[toasts.length - 1].id)} />
            )}

            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 99999,
                display: 'flex', flexDirection: 'column', gap: '12px',
                maxWidth: '460px', width: '90%', pointerEvents: 'none',
            }}>
                {toasts.map((t) => {
                    const color = colorMap[t.type] || colorMap.info;
                    return (
                        <div
                            key={t.id}
                            style={{
                                background: `linear-gradient(135deg, ${bgMap[t.type] || bgMap.info}, rgba(15,15,20,0.95))`,
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: `1px solid ${borderMap[t.type] || borderMap.info}`,
                                borderRadius: '18px',
                                padding: '24px 28px',
                                display: 'flex', flexDirection: 'column', gap: '8px',
                                boxShadow: `0 12px 48px rgba(0,0,0,0.6), 0 0 30px ${color}20`,
                                animation: 'toastPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                pointerEvents: 'auto',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header row with icon and close */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className={iconMap[t.type] || iconMap.info} style={{
                                        color: color, fontSize: '1.4rem',
                                    }}></i>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '1.5px', color: color,
                                    }}>
                                        {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : t.type === 'warning' ? 'Warning' : 'Info'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeToast(t.id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                                        fontSize: '0.8rem', width: '28px', height: '28px',
                                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Message body */}
                            <div style={{ marginTop: '4px' }}>
                                {t.message.split('\n').map((line, i) => {
                                    if (!line.trim()) return <div key={i} style={{ height: '6px' }}></div>;

                                    const isTitle = line.startsWith('🎉') || line.startsWith('❌') || line.startsWith('✅') || line.startsWith('⚠️');
                                    const code = extractCode(line);

                                    if (code) {
                                        return (
                                            <div key={i} style={{
                                                background: 'rgba(0,0,0,0.4)',
                                                padding: '12px 16px', borderRadius: '12px',
                                                marginTop: '8px', marginBottom: '4px',
                                                border: `1px solid ${color}40`,
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                                        {line.includes('Team') ? 'Your Team Code' : 'Your Host Code'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1.6rem', fontWeight: 900, letterSpacing: '6px',
                                                        color: color, fontFamily: 'monospace',
                                                    }}>
                                                        {code}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(code);
                                                        const btn = document.activeElement;
                                                        if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 1500); }
                                                    }}
                                                    style={{
                                                        background: `${color}20`, border: `1px solid ${color}`,
                                                        color: color, padding: '8px 16px', borderRadius: '10px',
                                                        fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    <i className="fas fa-copy" style={{ marginRight: '5px' }}></i> Copy
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={i} style={{
                                            fontSize: isTitle ? '1rem' : '0.85rem',
                                            fontWeight: isTitle ? 800 : 400,
                                            color: isTitle ? '#fff' : 'rgba(255,255,255,0.7)',
                                            marginBottom: '3px',
                                            lineHeight: 1.5,
                                        }}>
                                            {line}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* OK button */}
                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    marginTop: '10px', width: '100%',
                                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                    border: 'none', color: '#000', padding: '12px',
                                    borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800,
                                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
                                }}
                            >
                                OK
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes toastPopIn {
                    from {
                        transform: scale(0.85);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
