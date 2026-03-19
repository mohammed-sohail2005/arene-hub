import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import bgGaming from '../assets/bg-gaming.png';

const MAP_DATA = {
    bgmi: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin", "Nusa", "Rondo"],
    freefire: ["Bermuda", "Purgatory", "Kalahari", "Alpine", "NeXTerra"],
    cod: ["Isolated", "Blackout", "Alcatraz", "Crash", "Firing Range", "Standoff"]
};

import { supabase } from '../lib/supabase';

const HostModal = ({ isOpen, onClose }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        game: '',
        map: '',
        format: 'Squad',
        ownerName: '',
        tournamentName: '',
        prizePool: '',
        date: '',
        roomTime: '',
        startTime: '',
        maxPlayers: '100',
        maxTeams: '25',
        entryFee: '',
        upiId: '',
        youtubeLink: '',
        rules: '',
        isPrivate: false,
        password: '',
        pointSystem: {
            kill: 1,
            rank_1: 15, rank_2: 12, rank_3: 10, rank_4: 8, rank_5: 6, rank_6: 4,
            rank_7: 2, rank_8: 1, rank_9: 1, rank_10: 1, rank_11: 0, rank_12: 0
        }
    });

    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [dateChips, setDateChips] = useState([]);
    const [isEligibleForFreeTrial, setIsEligibleForFreeTrial] = useState(true);
    const [isCheckingTrial, setIsCheckingTrial] = useState(false);
    const [createdCode, setCreatedCode] = useState(null);
    const [createdTournamentId, setCreatedTournamentId] = useState(null);
    const navigate = useNavigate();

    // Debounced check for Free Trial eligibility based on UPI ID
    useEffect(() => {
        if (!formData.upiId) {
            setIsEligibleForFreeTrial(true);
            setIsCheckingTrial(false);
            return;
        }

        const checkEligibility = async () => {
            setIsCheckingTrial(true);
            try {
                const { data } = await supabase
                    .from('tournaments')
                    .select('created_at')
                    .eq('upi_id', formData.upiId)
                    .not('host_code', 'like', 'archived_%')
                    .order('created_at', { ascending: true })
                    .limit(1);

                if (!data || data.length === 0) {
                    setIsEligibleForFreeTrial(true);
                } else {
                    const firstCreated = new Date(data[0].created_at);
                    const now = new Date();
                    const daysSinceFirst = (now - firstCreated) / (1000 * 60 * 60 * 24);
                    setIsEligibleForFreeTrial(daysSinceFirst < 60);
                }
            } catch (error) {
                console.error("Error checking trial eligibility:", error);
                setIsEligibleForFreeTrial(true); // default to free on error to prevent blocking
            } finally {
                setIsCheckingTrial(false);
            }
        };

        const timeoutId = setTimeout(checkEligibility, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.upiId]);

    useEffect(() => {
        const chips = [];
        const today = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            chips.push({
                fullDate: d.toISOString().split('T')[0],
                day: i === 0 ? 'Today' : (i === 1 ? 'Tmw' : days[d.getDay()]),
                dateNum: d.getDate(),
                month: months[d.getMonth()]
            });
        }
        setDateChips(chips);
    }, []);

    if (!isOpen) return null;

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setPhotoPreview(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.game) {
            toast.warning('Please select a game.');
            return;
        }
        if (!formData.map) {
            toast.warning('Please select a map.');
            return;
        }

        setIsSubmitting(true);

        try {
            const hostCode = Math.floor(100000 + Math.random() * 900000).toString();
            const pPool = formData.prizePool ? parseFloat(formData.prizePool) : 0;
            
            // Calculate Hosting Fee
            let hostingFee = 99;
            if (pPool > 3000) {
                const extra = pPool - 3000;
                const increments = Math.ceil(extra / 500);
                hostingFee += (increments * 20);
            }

            // 1. Upload photo if exists to get URL first so we can save it in localStorage
            let photoUrl = null;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('tournaments')
                    .upload(filePath, photoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('tournaments')
                    .getPublicUrl(filePath);

                photoUrl = publicUrl;
            }

            // 2. Build tournament data
            const tournamentData = {
                host_code: hostCode,
                game: formData.game,
                map: formData.map,
                format: formData.format,
                owner_name: formData.ownerName,
                tournament_name: formData.tournamentName,
                prize_pool: pPool,
                date: formData.date,
                room_time: formData.roomTime || null,
                start_time: formData.startTime || null,
                max_players: parseInt(formData.maxPlayers) || 100,
                max_teams: parseInt(formData.maxTeams) || 25,
                entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
                upi_id: formData.upiId,
                youtube_link: formData.youtubeLink,
                rules: formData.rules,
                is_private: formData.isPrivate,
                password: formData.isPrivate ? formData.password : null,
                photo_url: photoUrl,
                point_system: formData.pointSystem,
            };

            // 3. Check if this host is eligible for the 2-month free trial (by UPI ID)
            let isFreeTrial = false;
            if (formData.upiId) {
                const { data: pastTournaments } = await supabase
                    .from('tournaments')
                    .select('created_at')
                    .eq('upi_id', formData.upiId)
                    .not('host_code', 'like', 'archived_%')
                    .order('created_at', { ascending: true })
                    .limit(1);

                if (!pastTournaments || pastTournaments.length === 0) {
                    // Brand new host — free trial!
                    isFreeTrial = true;
                } else {
                    const firstCreated = new Date(pastTournaments[0].created_at);
                    const now = new Date();
                    const daysSinceFirst = (now - firstCreated) / (1000 * 60 * 60 * 24);
                    if (daysSinceFirst < 60) {
                        // Within 2-month free trial window
                        isFreeTrial = true;
                    }
                }
            } else {
                // No UPI ID provided — treat as new host, give free trial
                isFreeTrial = true;
            }

            if (isFreeTrial) {
                // FREE TRIAL: Insert directly into Supabase, skip Dodo Payments
                toast.success('🎉 Free Trial Active! Creating your tournament...', 3000);

                let result = await supabase.from('tournaments').insert([tournamentData]).select();
                if (result.error) throw result.error;

                if (result.data && result.data.length > 0) {
                    setCreatedCode(hostCode);
                    setCreatedTournamentId(result.data[0].id);
                }

                toast.success(`🎉 Tournament Created Successfully!\n\nYour Host Code is: ${hostCode}\n\nPlease keep this safe!`, 10000);
            } else {
                // PAID: Insert into DB as 'pending' and redirect to Dodo
                toast.success(`Hosting Fee: ₹${hostingFee}. Redirecting to payment...`, 3000);

                const pendingTournamentData = { ...tournamentData, host_code: `pending_${hostCode}` };

                // Insert the pending row into Database
                let result = await supabase.from('tournaments').insert([pendingTournamentData]);
                if (result.error) throw result.error;

                const response = await fetch('/api/dodo/payments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_DODO_API_KEY}`
                    },
                    body: JSON.stringify({
                        billing: { country: 'IN', city: '', state: '', street: '', zipcode: '' },
                        customer: { email: 'support@arenahub.com', name: formData.ownerName },
                        product_cart: [{
                                product_id: import.meta.env.VITE_DODO_PRODUCT_ID,
                                amount: hostingFee * 100,
                                quantity: 1
                        }],
                        payment_link: true,
                        return_url: `${window.location.origin}/?payment=success&host_code=${hostCode}`,
                    })
                });

                if (!response.ok) {
                    const text = await response.text();
                    let errData;
                    try { errData = JSON.parse(text); } catch(e) { errData = { detail: text }; }
                    console.error("Dodo API Error:", errData);
                    throw new Error(errData.message || errData.detail || 'Failed to initialize payment');
                }

                const paymentData = await response.json();
                
                if (paymentData && paymentData.payment_link) {
                    window.location.href = paymentData.payment_link;
                } else {
                    throw new Error('No payment link returned from Dodo. Check your API Keys.');
                }
            }

        } catch (error) {
            console.error('Error creating tournament:', error);
            toast.error('Failed to create tournament: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };


    return (
        <div className="modal-overlay" style={{ 
            display: 'flex', 
            background: `linear-gradient(rgba(10, 12, 16, 0.9), rgba(10, 12, 16, 0.9)), url(${bgGaming})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            zIndex: 9999
        }} onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            
            <div className="modal glass" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', padding: '30px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <button onClick={onClose} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
                    </button>
                </div>

                <div className="modal-header" style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Host a <span className="header-glow" style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>Tournament</span></h2>
                    <p style={{ color: 'var(--text-dim)' }}>Fill in the details below to create your tournament match</p>
                </div>

                {createdCode ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
                        <h2 style={{ marginBottom: '10px' }}>Tournament Created!</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>
                            {formData.tournamentName} • {formData.format}
                        </p>
                        <div style={{ background: 'rgba(0,255,156,0.1)', border: '2px dashed var(--primary)', borderRadius: '16px', padding: '30px', marginBottom: '30px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Your Host Code</div>
                            <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '8px', color: 'var(--primary)' }}>{createdCode}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px' }}>Keep this safe to manage your tournament</p>
                        </div>

                        <button 
                            className="btn hover-glow" 
                            style={{ 
                                width: '100%', padding: '16px', marginBottom: '16px',
                                background: 'rgba(0,255,156,0.08)', border: '1px solid var(--primary)',
                                color: 'var(--primary)', fontWeight: 800
                            }} 
                            onClick={() => {
                                const link = `${window.location.origin}/details/${createdTournamentId}`;
                                navigator.clipboard.writeText(link);
                                toast.success('Registration Link Copied!');
                                navigate(`/details/${createdTournamentId}`);
                                onClose();
                            }}
                        >
                            <i className="fas fa-link" style={{ marginRight: '10px' }}></i> COPY REGISTRATION LINK
                        </button>
                        <button className="btn btn-outline" style={{ width: '100%', padding: '16px' }} onClick={onClose}>
                             DONE
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>

                    {/* Game Selection */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-gamepad" style={{ color: 'var(--primary)' }}></i>
                            <h3>Select Game *</h3>
                        </div>
                        <div className="selection-grid wrap-mobile" style={{ gap: '16px', marginBottom: '24px' }}>
                            {['bgmi', 'freefire', 'cod'].map(g => (
                                <div key={g}
                                    className={`selection-card glass ${formData.game === g ? 'active' : ''}`}
                                    style={{ padding: '20px', textAlign: 'center', cursor: 'pointer', borderRadius: '12px', border: formData.game === g ? '2px solid var(--primary)' : '1px solid var(--border)', transition: '0.3s' }}
                                    onClick={() => updateField('game', g)}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>{g}</div>
                                </div>
                            ))}
                        </div>

                        {/* Profile & Owner */}
                        <div className="grid-mobile-col" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '32px', marginBottom: '32px', alignItems: 'flex-end' }}>
                            <div>
                                <label className="form-label">Profile Photo (Optional)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <input type="file" id="reactPhotoInput" style={{ display: 'none' }} onChange={handlePhotoChange} />
                                    <div className="photo-uploader" onClick={() => document.getElementById('reactPhotoInput').click()} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                                        {photoPreview ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-camera" style={{ color: 'var(--text-dim)' }}></i>}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', cursor: 'pointer' }} onClick={() => document.getElementById('reactPhotoInput').click()}>Click to upload</span>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Owner Name *</label>
                                <input type="text" className="form-control" value={formData.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tournament Name *</label>
                            <input type="text" className="form-control" value={formData.tournamentName} onChange={(e) => updateField('tournamentName', e.target.value)} required />
                        </div>
                    </div>

                    {/* Match Format */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-users-cog" style={{ color: 'var(--primary)' }}></i>
                            <h3>Match Format</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Match Format *</label>
                            <div className="wrap-mobile" style={{ gap: '10px' }}>
                                {['Solo', 'Duo', 'Squad'].map(f => (
                                    <div key={f}
                                        className={`selection-pill ${formData.format === f ? 'active' : ''}`}
                                        style={{ flex: 1, textAlign: 'center', padding: '12px', background: formData.format === f ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: formData.format === f ? '#000' : '#fff', borderRadius: '8px', cursor: 'pointer' }}
                                        onClick={() => updateField('format', f)}>
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Maps & Date */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-map-marked-alt" style={{ color: 'var(--primary)' }}></i>
                            <h3>Visual Selections</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Map *</label>
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '10px 0' }}>
                                {formData.game ? MAP_DATA[formData.game].map(m => (
                                    <div key={m}
                                        className={`selection-pill ${formData.map === m ? 'active' : ''}`}
                                        style={{ padding: '10px 20px', background: formData.map === m ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: formData.map === m ? '#000' : '#fff', borderRadius: '30px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        onClick={() => updateField('map', m)}>
                                        {m}
                                    </div>
                                )) : <p style={{ color: 'var(--text-dim)' }}>Please select a game first</p>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Match Date *</span>
                                <span style={{ color: 'var(--primary)' }}>{formData.date ? formData.date : 'Not selected'}</span>
                            </label>
                            <div className="date-chips">
                                {dateChips.map(c => (
                                    <div key={c.fullDate}
                                        className={`date-chip ${formData.date === c.fullDate ? 'active' : ''}`}
                                        onClick={() => updateField('date', c.fullDate)}>
                                        <span className="day">{c.day}</span>
                                        <span className="date">{c.dateNum}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Logistics */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-clock" style={{ color: 'var(--primary)' }}></i>
                            <h3>Timing & Logistics</h3>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Room Opening Time *</label>
                                <input type="time" className="form-control" value={formData.roomTime} onChange={(e) => updateField('roomTime', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Match Start Time *</label>
                                <input type="time" className="form-control" value={formData.startTime} onChange={(e) => updateField('startTime', e.target.value)} required />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Prize Pool (₹) *</label>
                                <input type="number" className="form-control" value={formData.prizePool} onChange={(e) => updateField('prizePool', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Entry Fee (₹)</label>
                                <input type="number" className="form-control" value={formData.entryFee} onChange={(e) => updateField('entryFee', e.target.value)} placeholder="Free if empty" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label"><i className="fas fa-users" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>Number of Teams *</label>
                            <input type="number" className="form-control" min="1" max="100" value={formData.maxTeams} onChange={(e) => updateField('maxTeams', e.target.value)} placeholder="e.g., 25" required />
                            <span className="form-help">Total teams allowed to register for this tournament.</span>
                        </div>
                    </div>

                    {/* Point System Configuration */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-list-ol" style={{ color: 'var(--primary)' }}></i>
                            <h3>Point System Configuration</h3>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
                            Define how points are awarded for kills and placement.
                        </p>
                        
                        <div className="form-group">
                            <label className="form-label">Points Per Kill</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={formData.pointSystem.kill} 
                                onChange={(e) => updateField('pointSystem', { ...formData.pointSystem, kill: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <label className="form-label" style={{ marginTop: '10px', display: 'block' }}>Placement Points</label>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                            gap: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)'
                        }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(r => (
                                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', width: '40px', color: 'var(--text-dim)' }}>#{r}</span>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        style={{ padding: '6px', fontSize: '0.8rem' }}
                                        value={formData.pointSystem[`rank_${r}`]}
                                        onChange={(e) => updateField('pointSystem', { ...formData.pointSystem, [`rank_${r}`]: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Privacy */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }}></i>
                            <h3>Security & Privacy</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: formData.isPrivate ? '20px' : '0' }}>
                            <input type="checkbox" id="privateToggle" checked={formData.isPrivate} onChange={(e) => updateField('isPrivate', e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                            <label htmlFor="privateToggle" style={{ cursor: 'pointer' }}>Make Tournament Private (Password Required)</label>
                        </div>
                        {formData.isPrivate && (
                            <div className="form-group">
                                <label className="form-label">Match Password *</label>
                                <input type="text" className="form-control" value={formData.password} onChange={(e) => updateField('password', e.target.value)} required />
                            </div>
                        )}
                    </div>

                    {/* Payment & Streaming */}
                    <div className="form-group-grouped">
                        <div className="section-title">
                            <i className="fas fa-credit-card" style={{ color: 'var(--primary)' }}></i>
                            <h3>Payment & Streaming Info</h3>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><i className="fas fa-wallet" style={{ marginRight: '8px', color: 'var(--primary)' }}></i> UPI ID for Entry Fees *</label>
                            <input type="text" className="form-control" value={formData.upiId} onChange={(e) => updateField('upiId', e.target.value)} placeholder="e.g., arena-hub@upi" required />
                            <span className="form-help">Points to where players will pay their entry fee.</span>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><i className="fab fa-youtube" style={{ marginRight: '8px', color: '#FF0000' }}></i> YouTube Channel Link (Optional)</label>
                            <input type="url" className="form-control" value={formData.youtubeLink} onChange={(e) => updateField('youtubeLink', e.target.value)} placeholder="https://youtube.com/@yourchannel" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Match Description / Extra Details</label>
                            <textarea className="form-control" rows="4" value={formData.rules} onChange={(e) => updateField('rules', e.target.value)} placeholder="Add specific match rules or description here..."></textarea>
                        </div>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', marginTop: '20px', border: '1px solid var(--border)' }}>
                        {isCheckingTrial ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
                                <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)', marginRight: '10px' }}></i> Checking Free Trial Eligibility...
                            </div>
                        ) : isEligibleForFreeTrial ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#00e676', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                    <i className="fas fa-gift"></i> 2-Month Free Trial Active!
                                </div>
                                <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                    Your Platform Hosting Fee (₹{parseFloat(formData.prizePool) > 3000 ? 99 + Math.ceil((parseFloat(formData.prizePool) - 3000) / 500) * 20 : 99}) is waived. Enjoy hosting!
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Base Hosting Fee (up to ₹3000 prize)</span>
                                    <span style={{ fontWeight: 'bold' }}>₹99</span>
                                </div>
                                {parseFloat(formData.prizePool) > 3000 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: 'var(--primary)' }}>
                                        <span>Extra Prize Pool Fee (+₹20 per ₹500 over ₹3000)</span>
                                        <span>+₹{(Math.ceil((parseFloat(formData.prizePool) - 3000) / 500) * 20)}</span>
                                    </div>
                                )}
                                <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                                    <span>Total Platform Fee:</span>
                                    <span>₹{99 + (parseFloat(formData.prizePool) > 3000 ? Math.ceil((parseFloat(formData.prizePool) - 3000) / 500) * 20 : 0)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: '30px' }}>
                        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} disabled={isSubmitting || isCheckingTrial}>
                            {isSubmitting || isCheckingTrial ? <i className="fas fa-spinner fa-spin"></i> : <i className={isEligibleForFreeTrial ? 'fas fa-check-circle' : 'fas fa-lock'}></i>}
                            {isSubmitting ? 'Processing...' : (isEligibleForFreeTrial ? 'Create for Free' : 'Pay & Create')}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
};

export default HostModal;
