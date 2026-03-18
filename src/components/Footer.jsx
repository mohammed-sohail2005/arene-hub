import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ padding: '60px 20px', textAlign: 'center', borderTop: '1px solid var(--border)', marginTop: '100px' }}>
            <div className="logo" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <img src="/logo.jpg" alt="Arena Hub" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                ARENA<span style={{ color: 'var(--primary)' }}>HUB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px 40px', color: 'var(--text-dim)', fontSize: '0.9rem', flexWrap: 'wrap', padding: '0 20px' }}>
                <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'var(--text-dim)', textDecoration: 'none', cursor: 'pointer' }}>About</a>
                <Link to="/terms" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Terms</Link>
                <Link to="/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Privacy</Link>
                <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'var(--text-dim)', textDecoration: 'none', cursor: 'pointer' }}>Contact</a>
                <a href="https://instagram.com/arenahub.official" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fab fa-instagram"></i> Instagram
                </a>
            </div>
            <p style={{ marginTop: '24px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>© 2026 Arena Hub. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
