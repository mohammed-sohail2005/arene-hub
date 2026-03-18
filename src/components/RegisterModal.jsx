import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

const RegisterModal = ({ isOpen, onClose, tournament }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [squadName, setSquadName] = useState('');
    const [squadUpi, setSquadUpi] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [paymentPreview, setPaymentPreview] = useState(null);
    const [paymentFile, setPaymentFile] = useState(null);
    const [createdTeamCode, setCreatedTeamCode] = useState(null);
    const [players, setPlayers] = useState([
        { name: '', id: '', label: 'Player 1 – IGL (In-Game Leader)' },
        { name: '', id: '', label: 'Player 2' },
        { name: '', id: '', label: 'Player 3' },
        { name: '', id: '', label: 'Player 4' }
    ]);

    if (!isOpen) return null;

    const entryFee = tournament?.entry_fee || 0;
    const upiId = tournament?.upi_id || '';
    const tournamentName = tournament?.tournament_name || 'Tournament';
    const isFree = entryFee <= 0;

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setLogoPreview(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePaymentScreenshot = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPaymentFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setPaymentPreview(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePlayerChange = (index, field, value) => {
        const newPlayers = [...players];
        newPlayers[index][field] = value;
        setPlayers(newPlayers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Player ID Validations ---
        for (let i = 0; i < players.length; i++) {
            if (players[i].id.length !== 10) {
                toast.error(`${players[i].label} ID must be exactly 10 digits.`);
                return;
            }
        }

        const ids = players.map(p => p.id);
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== players.length) {
            toast.error("All Player IDs within the squad must be unique.");
            return;
        }

        // Logic fallback: payment screenshot is now optional per user request.
        /* 
        if (!isFree && !paymentFile) {
            toast.warning('Please upload your payment screenshot to proceed.');
            return;
        }
        */

        // Logic fallback: payment screenshot is now optional per user request.
        
        setIsSubmitting(true);

        let registrationSlot = 1;

        // --- Squad Capacity Check ---
        try {
            const baseMaxTeams = tournament?.max_teams || Math.floor((tournament?.max_players || 100) / 4);
            const totalMaxTeams = baseMaxTeams * (tournament?.num_qualifiers || 1);
            const { count, error: countError } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('host_code', tournament?.host_code || '');

            if (!countError && count !== null) {
                if (count >= totalMaxTeams) {
                    toast.error(`🚫 Tournament Full! All ${totalMaxTeams} squad slots are taken.`);
                    setIsSubmitting(false);
                    return;
                }
                registrationSlot = count + 1;
            }
            
            // --- Player ID Global Uniqueness Check ---
            const { data: existingRegs, error: fetchError } = await supabase
                .from('registrations')
                .select('players')
                .eq('tournament_id', tournament?.id || null);

            if (!fetchError && existingRegs) {
                const allExistingIds = existingRegs.flatMap(reg => {
                    const regPlayers = Array.isArray(reg.players) ? reg.players : JSON.parse(reg.players || '[]');
                    return regPlayers.map(p => p.id);
                });
                for (const player of players) {
                    if (allExistingIds.includes(player.id)) {
                        toast.error(`Player ID ${player.id} is already registered in this tournament.`);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }
        } catch (err) {
            console.warn('Could not verify squad capacity or unique IDs:', err);
        }
        // --- End Capacity Check ---

        const teamCode = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            let paymentScreenshotUrl = null;
            let squadLogoUrl = null;

            // 1. Upload Squad Logo if exists
            if (logoFile) {
                const logoExt = logoFile.name.split('.').pop();
                const logoFileName = `logo_${teamCode}_${Date.now()}.${logoExt}`;
                const logoPath = `logos/${logoFileName}`;

                try {
                    const { error: logoError } = await supabase.storage
                        .from('tournaments')
                        .upload(logoPath, logoFile);

                    if (!logoError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('tournaments')
                            .getPublicUrl(logoPath);
                        squadLogoUrl = publicUrl;
                    }
                } catch (err) {
                    console.warn('Logo upload failed:', err);
                }
            }

            // 2. Upload Payment Screenshot if exists
            if (paymentFile) {
                const fileExt = paymentFile.name.split('.').pop();
                const fileName = `payment_${teamCode}_${Date.now()}.${fileExt}`;

                try {
                    const { error: uploadError } = await supabase.storage
                        .from('tournaments')
                        .upload(fileName, paymentFile);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('tournaments')
                            .getPublicUrl(fileName);
                        paymentScreenshotUrl = publicUrl;
                    } else {
                        console.warn('Screenshot upload failed:', uploadError.message);
                    }
                } catch (storageErr) {
                    console.warn('Storage error:', storageErr);
                }
            }

            const registrationData = {
                tournament_id: tournament?.id || null,
                host_code: tournament?.host_code || '',
                team_code: teamCode,
                squad_name: squadName,
                squad_upi: squadUpi,
                players: players.map(p => ({ name: p.name, id: p.id })),
                squad_logo_url: squadLogoUrl,
                slot_number: registrationSlot,
            };

            if (paymentScreenshotUrl) {
                registrationData.payment_screenshot_url = paymentScreenshotUrl;
            }

            let result = await supabase.from('registrations').insert([registrationData]);

            if (result.error) {
                console.error('Insert failed:', result.error.message);
                toast.error(`Registration failed!\n${result.error.message}`);
                setIsSubmitting(false);
                return;
            }

            setCreatedTeamCode(teamCode);
            toast.success(`🎉 Squad registered successfully!`, 5000);
            // Don't call onClose() yet, let the success screen show
        } catch (err) {
            console.error('Registration error:', err);
            toast.error(`Registration failed!\n${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Success View
    if (createdTeamCode) {
        return (
            <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
                <div className="modal glass" style={{ maxWidth: '450px', padding: '40px', textAlign: 'center', border: '1px solid var(--primary)' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
                    <h2 style={{ marginBottom: '10px' }}>Registration Successful!</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Your squad has been registered for {tournamentName}.</p>
                    
                    <div style={{ background: 'rgba(0,255,156,0.1)', border: '2px dashed var(--primary)', borderRadius: '16px', padding: '24px', marginBottom: '30px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Your Team Code</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '6px', color: 'var(--primary)' }}>{createdTeamCode}</div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '10px' }}>CRITICAL: Save this code to access the Team Portal for Room ID & Password.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="btn btn-outline" 
                            style={{ flex: 1, padding: '12px' }}
                            onClick={() => { navigator.clipboard.writeText(createdTeamCode); toast.copied('Team Code copied!'); }}
                        >
                            <i className="fas fa-copy" style={{ marginRight: '8px' }}></i> COPY CODE
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={onClose}>
                            DONE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal glass" style={{ maxWidth: '600px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, letterSpacing: '1px' }}>Register Your Squad</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '30px', overflowY: 'auto', maxHeight: '70vh' }}>
                    {/* Logo Selection */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                        <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '15px' }}>Squad Logo (Optional)</label>
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <input type="file" id="squadLogoInput" style={{ display: 'none' }} onChange={handleLogoChange} accept="image/*" />
                            <div
                                onClick={() => document.getElementById('squadLogoInput').click()}
                                style={{
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    border: '2px dashed var(--primary)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden',
                                    background: 'rgba(0, 255, 156, 0.05)', transition: '0.3s'
                                }}
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Squad Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <i className="fas fa-camera" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>UPLOAD</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>Squad Name *</label>
                            <input
                                type="text" className="form-control"
                                placeholder="e.g., Shadow Wolves"
                                value={squadName}
                                onChange={(e) => setSquadName(e.target.value)}
                                required
                                style={{ borderColor: 'var(--primary)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>Squad UPI ID *</label>
                            <input
                                type="text" className="form-control"
                                placeholder="For prize pool payouts"
                                value={squadUpi}
                                onChange={(e) => setSquadUpi(e.target.value)}
                                required
                                style={{ borderColor: 'var(--primary)' }}
                            />
                        </div>
                    </div>

                    {/* Players Info */}
                    {players.map((player, index) => (
                        <div key={index} className="form-group-grouped" style={{ background: 'rgba(0, 255, 156, 0.02)', border: '1px solid rgba(0, 255, 156, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                            <label className="form-label" style={{ color: 'var(--primary)', marginBottom: '15px', display: 'block' }}>{player.label} *</label>
                            <div className="grid-2" style={{ gap: '15px' }}>
                                <input type="text" className="form-control" placeholder="Game name" value={player.name} onChange={(e) => handlePlayerChange(index, 'name', e.target.value)} required />
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Game ID (10 digits)" 
                                    value={player.id} 
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) {
                                            handlePlayerChange(index, 'id', val);
                                        }
                                    }} 
                                    pattern="\d{10}"
                                    title="Game ID must be exactly 10 digits"
                                    required 
                                />
                            </div>
                        </div>
                    ))}

                    {/* Payment Screenshot Section */}
                    {!isFree && (
                        <div style={{
                            border: `1px solid ${paymentPreview ? '#00ff9c' : 'var(--primary)'}`,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            marginBottom: '24px',
                            transition: '0.3s',
                        }}>
                            <div style={{
                                background: paymentPreview
                                    ? 'linear-gradient(135deg, rgba(0,255,156,0.2) 0%, rgba(0,255,156,0.08) 100%)'
                                    : 'linear-gradient(135deg, rgba(0,255,156,0.12) 0%, rgba(0,255,156,0.04) 100%)',
                                padding: '18px 24px',
                                borderBottom: '1px solid rgba(0,255,156,0.15)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-receipt" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Payment Proof</h4>
                                    </div>
                                    <div style={{
                                        background: paymentPreview ? 'rgba(0,255,156,0.2)' : 'rgba(255,255,255,0.05)',
                                        padding: '4px 14px', borderRadius: '20px',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: paymentPreview ? '#00ff9c' : 'var(--text-dim)',
                                    }}>
                                        {paymentPreview ? '✅ UPLOADED' : 'OPTIONAL'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px 24px' }}>
                                <div style={{
                                    background: 'rgba(0,0,0,0.25)', padding: '16px',
                                    borderRadius: '12px', marginBottom: '16px',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                                        Payment Details
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Entry Fee</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{entryFee}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Pay To</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tournament?.owner_name || 'Host'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>UPI ID</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{upiId}</span>
                                            <button
                                                type="button"
                                                onClick={() => { navigator.clipboard.writeText(upiId); toast.copied('UPI ID copied!'); }}
                                                style={{
                                                    background: 'rgba(0,255,156,0.1)', border: '1px solid var(--primary)',
                                                    color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px',
                                                    fontSize: '0.65rem', cursor: 'pointer', fontWeight: 700,
                                                }}
                                            >
                                                <i className="fas fa-copy" style={{ marginRight: '3px' }}></i> COPY
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)',
                                    padding: '14px 16px', borderRadius: '10px', marginBottom: '16px',
                                }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFC107', marginBottom: '8px' }}>
                                        <i className="fas fa-list-ol" style={{ marginRight: '6px' }}></i> How to Pay
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                                        <div>1️⃣ Open your UPI app (GPay, PhonePe, Paytm)</div>
                                        <div>2️⃣ Send <strong style={{ color: '#fff' }}>₹{entryFee}</strong> to <strong style={{ color: 'var(--primary)' }}>{upiId}</strong></div>
                                        <div>3️⃣ Take a screenshot of the payment confirmation</div>
                                        <div>4️⃣ Upload the screenshot below</div>
                                    </div>
                                </div>

                                <input type="file" id="paymentScreenshotInput" style={{ display: 'none' }} onChange={handlePaymentScreenshot} accept="image/*" />

                                {!paymentPreview ? (
                                    <div
                                        onClick={() => document.getElementById('paymentScreenshotInput').click()}
                                        style={{
                                            border: '2px dashed var(--primary)',
                                            borderRadius: '14px', padding: '30px',
                                            textAlign: 'center', cursor: 'pointer',
                                            background: 'rgba(0,255,156,0.02)',
                                            transition: '0.3s',
                                        }}
                                    >
                                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '10px' }}></i>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>Upload Payment Screenshot</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Click to browse or drag & drop</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '6px' }}>Supports: JPG, PNG, WEBP</div>
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            border: '2px solid #00ff9c',
                                            borderRadius: '14px', overflow: 'hidden',
                                            background: 'rgba(0,0,0,0.3)',
                                        }}>
                                            <img
                                                src={paymentPreview}
                                                alt="Payment Screenshot"
                                                style={{
                                                    width: '100%', maxHeight: '250px',
                                                    objectFit: 'contain', display: 'block',
                                                }}
                                            />
                                            <div style={{
                                                padding: '10px 16px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: 'rgba(0,255,156,0.08)',
                                                borderTop: '1px solid rgba(0,255,156,0.2)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="fas fa-check-circle" style={{ color: '#00ff9c' }}></i>
                                                    <span style={{ fontSize: '0.75rem', color: '#00ff9c', fontWeight: 700 }}>Screenshot Uploaded</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setPaymentPreview(null); setPaymentFile(null); }}
                                                    style={{
                                                        background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)',
                                                        color: '#ff4d4d', padding: '4px 10px', borderRadius: '6px',
                                                        fontSize: '0.65rem', cursor: 'pointer', fontWeight: 700,
                                                    }}
                                                >
                                                    <i className="fas fa-times" style={{ marginRight: '3px' }}></i> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%', padding: '18px', fontSize: '1.1rem', fontWeight: 800,
                            opacity: 1,
                            cursor: 'pointer',
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '10px' }}></i> Registering...</>
                        ) : (
                            <><i className="fas fa-paper-plane" style={{ marginRight: '10px' }}></i> Complete Registration</>
                        )}
                    </button>

                    {/* Information about screenshot removed as it's now optional */}

                </form>
            </div>
        </div>
    );
};

export default RegisterModal;
