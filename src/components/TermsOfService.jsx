import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
                    TERMS OF <span style={{ color: 'var(--primary)' }}>SERVICE</span>
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '30px' }}>
                    Last updated: March 14, 2026
                </p>

                <div style={{ color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                    <Section title="1. Acceptance of Terms">
                        <p>By accessing or using Arena Hub, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
                    </Section>

                    <Section title="2. Platform Description">
                        <p>Arena Hub is an esports tournament hosting and management platform. We facilitate the creation, registration, and management of competitive gaming tournaments (BGMI, Free Fire, and other supported games).</p>
                    </Section>

                    <Section title="3. Tournament Hosting">
                        <ul>
                            <li>Hosts are responsible for setting accurate tournament details (prize pool, schedule, rules).</li>
                            <li>Hosts must distribute the declared prize pool to winners. Failure to do so will be recorded in the Host Integrity system.</li>
                            <li>A hosting fee may be charged based on the prize pool amount.</li>
                            <li>Host codes are confidential. Sharing your host code gives others control of your tournament.</li>
                        </ul>
                    </Section>

                    <Section title="4. Player Registration">
                        <ul>
                            <li>Players must provide accurate in-game IDs during registration.</li>
                            <li>Each player ID can only be registered once per tournament.</li>
                            <li>Entry fees (if applicable) must be paid via the specified UPI ID.</li>
                            <li>Payment proof screenshots may be required and are visible to the host.</li>
                        </ul>
                    </Section>

                    <Section title="5. Prize Pool & Payments">
                        <p>Arena Hub does <strong>not</strong> hold, manage, or guarantee any prize pool funds. All payments are made directly between hosts and players via UPI or other agreed methods.</p>
                        <p>We provide a <strong>Host Integrity</strong> section where hosts can upload proof of prize pool distribution. This is a transparency tool, not a guarantee.</p>
                    </Section>

                    <Section title="6. Prohibited Conduct">
                        <ul>
                            <li>Creating fake tournaments to collect entry fees without hosting matches.</li>
                            <li>Using hacks, cheats, or exploits during matches.</li>
                            <li>Registering with fake or duplicate player IDs.</li>
                            <li>Attempting to tamper with another user's tournament or registration data.</li>
                            <li>Uploading inappropriate, offensive, or illegal content.</li>
                        </ul>
                    </Section>

                    <Section title="7. Data & Content">
                        <p>By uploading content (screenshots, logos, etc.), you grant Arena Hub permission to display that content within the platform for tournament management purposes.</p>
                        <p>Tournament data is cleaned up upon completion. See our <a href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</a> for details.</p>
                    </Section>

                    <Section title="8. Limitation of Liability">
                        <p>Arena Hub is provided "as is" without warranties. We are not responsible for:</p>
                        <ul>
                            <li>Disputes between hosts and players regarding prize distribution.</li>
                            <li>In-game issues, server outages, or match interruptions.</li>
                            <li>Loss of data due to user error or third-party service failures.</li>
                        </ul>
                    </Section>

                    <Section title="9. Changes to Terms">
                        <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
                    </Section>

                    <Section title="10. Contact">
                        <p>For questions about these Terms, please reach out via our <a href="/#contact" style={{ color: 'var(--primary)' }}>Contact page</a>.</p>
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

export default TermsOfService;
