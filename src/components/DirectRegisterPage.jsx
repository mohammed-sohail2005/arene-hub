import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import RegisterModal from './RegisterModal';
import { useToast } from './Toast';

const DirectRegisterPage = ({ onBack }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const fetchTournament = async () => {
        setLoading(true);
        try {
            const { data, error: fetchErr } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchErr || !data) {
                throw new Error('Tournament not found or has been removed.');
            }

            setTournament(data);
        } catch (err) {
            console.error('Error fetching tournament for direct registration:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#050505',
                color: 'var(--text-dim)'
            }}>
                <div className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '20px' }}></div>
                <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Loading Registration Portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <div className="glass" style={{ padding: '60px 40px', borderRadius: '24px', border: '1px solid #ff4d4d', maxWidth: '500px', margin: '0 auto' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#ff4d4d', marginBottom: '20px' }}></i>
                    <h2 style={{ color: '#fff', marginBottom: '15px' }}>LINK EXPIRED</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>BACK TO HOME</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050505', paddingTop: '80px' }}>
            <div className="page-container" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>OFFICIAL <span style={{ color: 'var(--primary)' }}>REGISTRATION</span></h1>
                    <p style={{ color: 'var(--text-dim)' }}>You are registering for: <strong style={{ color: '#fff' }}>{tournament?.tournament_name}</strong></p>
                </div>

                {/* This renders the modal content directly on the page since we are on a dedicated route */}
                <RegisterModal 
                    isOpen={true} 
                    onClose={() => navigate('/')} 
                    tournament={tournament}
                />
            </div>
        </div>
    );
};

export default DirectRegisterPage;
