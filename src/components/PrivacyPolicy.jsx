import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px 80px' }}>
            <button
                onClick={() => navigate('/')}
                style={{
                    background: 'none', border: 'none', color: 'var(--primary)',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px'
                }}
            >
                <i className="fas fa-arrow-left"></i> Back to Home
            </button>

            <div className="glass" style={{ padding: '40px', borderRadius: '20px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
                    PRIVACY <span style={{ color: 'var(--primary)' }}>POLICY</span>
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '30px' }}>
                    Last updated: March 14, 2026
                </p>

                <div style={{ color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                    <Section title="1. Information We Collect">
                        <p>When you use Arena Hub, we may collect the following information:</p>
                        <ul>
                            <li><strong>Host Information:</strong> Your name, UPI ID, and tournament configuration details when you host a tournament.</li>
                            <li><strong>Player Information:</strong> Squad name, player names, in-game player IDs, and UPI IDs when registering for a tournament.</li>
                            <li><strong>Payment Screenshots:</strong> Images uploaded as proof of entry fee payment or prize pool distribution.</li>
                            <li><strong>Squad Logos:</strong> Optional team logos uploaded during registration.</li>
                        </ul>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <ul>
                            <li>To facilitate tournament hosting, registration, and management.</li>
                            <li>To display team information to hosts and other participants.</li>
                            <li>To verify payment transactions between hosts and players.</li>
                            <li>To maintain host integrity records and prevent fraud.</li>
                        </ul>
                    </Section>

                    <Section title="3. Data Storage & Security">
                        <p>Your data is stored securely using <strong>Supabase</strong>, a trusted cloud database provider with built-in encryption. Payment screenshots and logos are stored in secure cloud storage buckets with access controls.</p>
                        <p>We implement Row Level Security (RLS) policies to protect against unauthorized data access or modification.</p>
                    </Section>

                    <Section title="4. Data Retention & Deletion">
                        <p>Tournament data (registrations, payment screenshots) is automatically deleted when a host completes or archives a tournament. Host integrity records (prize pool proof) are retained for transparency purposes.</p>
                        <p>You may request deletion of your data by contacting us.</p>
                    </Section>

                    <Section title="5. Third-Party Services">
                        <p>We use the following third-party services:</p>
                        <ul>
                            <li><strong>Supabase:</strong> Database and file storage.</li>
                            <li><strong>Dodo Payments:</strong> Processing hosting fees.</li>
                            <li><strong>Vercel:</strong> Website hosting and deployment.</li>
                        </ul>
                    </Section>

                    <Section title="6. Your Rights">
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate information.</li>
                            <li>Request deletion of your data.</li>
                            <li>Withdraw from any tournament at any time.</li>
                        </ul>
                    </Section>

                    <Section title="7. Contact Us">
                        <p>If you have questions about this Privacy Policy, please reach out via our <a href="/#contact" style={{ color: 'var(--primary)' }}>Contact page</a>.</p>
                    </Section>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '28px' }}>
        <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>›</span> {title}
        </h3>
        {children}
    </div>
);

export default PrivacyPolicy;
