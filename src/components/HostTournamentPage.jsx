import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

const GAMES = ['bgmi', 'freefire', 'cod'];

const MAP_DATA = {
    bgmi: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin", "Nusa"],
    freefire: ["Bermuda", "Purgatory", "Kalahari", "Alpine", "NeXTerra"],
    cod: ["Isolated", "Blackout", "Alcatraz", "Crash", "Firing Range", "Standoff"]
};

const HostTournamentPage = ({ onBack }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [formData, setFormData] = useState({
        name: '',
        game: GAMES[0],
        entryFee: '',
        prizePool: '',
        slots: '25',
        whatsapp: '',
        upiId: '',
        overallStartTime: '18:00',
        roomTime: '15',
        numberOfMatches: 1,
        rules: '',
        youtubeLink: '',
        maxPlayers: 100,
        maxTeams: 25,
        registrationDeadlineDate: '',
        registrationDeadlineTime: '',
        pointSystem: {
            kill: 1,
            rank_1: 15, rank_2: 12, rank_3: 10, rank_4: 8, rank_5: 6, rank_6: 4,
            rank_7: 2, rank_8: 1, rank_9: 1, rank_10: 1, rank_11: 0, rank_12: 0
        }
    });
    const [matchMaps, setMatchMaps] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdCode, setCreatedCode] = useState(null);
    const [createdTournamentId, setCreatedTournamentId] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [dateChips, setDateChips] = useState([]);
    const [isEligibleForFreeTrial, setIsEligibleForFreeTrial] = useState(true);
    const [isCheckingTrial, setIsCheckingTrial] = useState(false);

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
                console.error('Error checking trial eligibility:', error);
                setIsEligibleForFreeTrial(true);
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
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            chips.push({
                fullDate: d.toISOString().split('T')[0],
                day: i === 0 ? 'Today' : (i === 1 ? 'Tmw' : days[d.getDay()]),
                dateNum: d.getDate(),
            });
        }
        setDateChips(chips);
    }, []);

    const updateSlotCustom = (idx, field, value) => {
        setSlotCustomizations(prev => ({
            ...prev,
            [idx]: { ...(prev[idx] || {}), [field]: value }
        }));
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };


    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setPhotoPreview(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const [tournamentType, setTournamentType] = useState('Standard'); // 'Standard' or 'Multi-Stage'
    const [stagedConfig, setStagedConfig] = useState({
        qualifierMatches: 1,
        includeSemiFinal: true,
        finalMatches: 1,
    });

    const [slotCustomizations, setSlotCustomizations] = useState({});

    // Fixed 1-hour slots
    const matchSlots = useMemo(() => {
        const { numberOfMatches, overallStartTime } = formData;
        if (!overallStartTime || numberOfMatches < 1) return [];

        const [startH, startM] = overallStartTime.split(':').map(Number);
        const slotDuration = 60; // Fixed 1 hour
        const slots = [];

        let count = numberOfMatches;
        if (tournamentType === 'Multi-Stage') {
            count = stagedConfig.qualifierMatches + (stagedConfig.includeSemiFinal ? 1 : 0) + (stagedConfig.finalMatches || 1);
        }

        for (let i = 0; i < count; i++) {
            const custom = slotCustomizations[i] || {};
            
            // Time logic
            let start = '';
            if (custom.start) {
                start = custom.start;
            } else {
                const slotStartMins = (startH * 60 + startM) + (i * slotDuration);
                const fmt = (mins) => {
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                };
                start = fmt(slotStartMins);
            }

            const [sH, sM] = start.split(':').map(Number);
            const endMins = (sH * 60 + sM) + slotDuration;
            const fmt = (mins) => {
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            };

            slots.push({
                match: i + 1,
                start: start,
                end: fmt(endMins),
                date: custom.date || formData.date,
                release: custom.release || formData.matchDetailsReleaseTime,
                duration: slotDuration,
            });
        }

        // Auto-update overall matches for standard
        if (tournamentType === 'Standard') {
            // Note: We don't mutate formData directly here anymore.
            // We'll calculate the summary info in the render or before submit.
        }

        return slots;
    }, [formData.numberOfMatches, formData.overallStartTime, tournamentType, stagedConfig, slotCustomizations, formData.date, formData.matchDetailsReleaseTime]);

    const handleSubmit = async () => {
        if (!formData.game || !formData.hosterName || !formData.tournamentName || !formData.upiId) {
            return;
        }

        
        let slotsToCreate = [];
        const { qualifierMatches, includeSemiFinal, finalMatches } = stagedConfig;

        slotsToCreate = matchSlots.map((slot, i) => {
            let stageName = '';
            if (tournamentType === 'Standard') {
                stageName = `Match ${i + 1}`;
            } else {
                if (i < qualifierMatches) {
                    stageName = `Qualifier ${i + 1}`;
                } else if (includeSemiFinal && i === qualifierMatches) {
                    stageName = 'Semi-Final';
                } else {
                    const finalIndex = i - qualifierMatches - (includeSemiFinal ? 1 : 0) + 1;
                    stageName = (finalMatches || 1) > 1 ? `Final Match ${finalIndex}` : 'Final';
                }
            }
            return { ...slot, stage: stageName };
        });

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

            let photoUrl = null;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('tournaments').upload(fileName, photoFile);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('tournaments').getPublicUrl(fileName);
                    photoUrl = publicUrl;
                }
            }

            const baseEntries = slotsToCreate.map((slot, idx) => ({
                game: formData.game,
                owner_name: formData.hosterName,
                tournament_name: tournamentType === 'Standard' ? `${formData.tournamentName} - ${slot.stage}` : `${formData.tournamentName} (${slot.stage})`,
                upi_id: formData.upiId,
                entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
                prize_pool: pPool,
                date: slot.date,
                start_time: slot.start,
                room_time: slot.release,
                map: matchMaps[idx + 1] || null,
                max_players: parseInt(formData.maxPlayers) || 100,
                max_teams: parseInt(formData.maxTeams) || 25,
                format: formData.format,
                type: 'Battle Royale',
                is_private: false,
                photo_url: photoUrl,
                youtube_link: formData.youtubeLink || null,
                rules: formData.description || null,
                stage: slot.stage,
                is_staged: tournamentType === 'Multi-Stage',
                num_qualifiers: tournamentType === 'Multi-Stage' ? stagedConfig.qualifierMatches : 1,
                point_system: formData.pointSystem,
                registration_deadline: formData.registrationDeadlineDate && formData.registrationDeadlineTime 
                    ? `${formData.registrationDeadlineDate}T${formData.registrationDeadlineTime}` 
                    : null,
            }));

            // Check if this host is eligible for the 2-month free trial (by UPI ID)
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
                    isFreeTrial = true;
                } else {
                    const firstCreated = new Date(pastTournaments[0].created_at);
                    const now = new Date();
                    const daysSinceFirst = (now - firstCreated) / (1000 * 60 * 60 * 24);
                    if (daysSinceFirst < 60) {
                        isFreeTrial = true;
                    }
                }
            } else {
                isFreeTrial = true;
            }

            if (isFreeTrial) {
                // FREE TRIAL: Insert directly into Supabase, skip Dodo Payments
                toast.success('🎉 Free Trial Active! Creating your tournament series...', 3000);

                let { data: insertedData, error: insertError } = await supabase.from('tournaments').insert(
                    baseEntries.map(e => ({ ...e, host_code: hostCode }))
                ).select();

                if (insertError) throw insertError;
                setCreatedCode(hostCode);
                if (insertedData && insertedData.length > 0) {
                    setCreatedTournamentId(insertedData[0].id);
                }

                toast.success(`🎉 Tournament Series Created!\n\nYour Host Code is: ${hostCode}`, 10000);
            } else {
                // PAID: Insert into DB as 'pending' and redirect to Dodo
                toast.success(`Hosting Fee: ₹${hostingFee}. Redirecting to payment...`, 3000);

                let { error: insertError } = await supabase.from('tournaments').insert(
                    baseEntries.map(e => ({ ...e, host_code: `pending_${hostCode}` }))
                );
                if (insertError) throw insertError;

                const response = await fetch('/api/dodo/payments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_DODO_API_KEY}`
                    },
                    body: JSON.stringify({
                        billing: { country: 'IN', city: '', state: '', street: '', zipcode: '' },
                        customer: { email: 'support@arenahub.com', name: formData.hosterName },
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
                    throw new Error(errData.message || errData.detail || 'Failed to initialize payment');
                }

                const paymentData = await response.json();
                if (paymentData && paymentData.payment_link) {
                    window.location.href = paymentData.payment_link;
                } else {
                    throw new Error('No payment link returned. Check your API Keys.');
                }
            }
        } catch (error) {
            console.error('Error creating tournament:', error);
            toast.error('Failed to create tournament: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success screen
    if (createdCode) {
        return (
            <div style={{ padding: '80px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <div className="glass" style={{ padding: '60px 40px', borderRadius: '24px', border: '1px solid var(--primary)' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
                    <h2 style={{ marginBottom: '10px' }}>Tournament Series Created!</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>
                        {formData.numberOfMatches} matches × 1 hour each • {formData.format}
                    </p>
                    <div style={{ background: 'rgba(0,255,156,0.1)', border: '2px dashed var(--primary)', borderRadius: '16px', padding: '30px', marginBottom: '30px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Your Host Code</div>
                        <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '8px', color: 'var(--primary)' }}>{createdCode}</div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px' }}>Share this code to track registrations</p>
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
                        }}
                    >
                        <i className="fas fa-link" style={{ marginRight: '10px' }}></i> COPY REGISTRATION LINK
                    </button>
                    <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={onBack}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '10px' }}></i> BACK TO HOME
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'radial-gradient(circle at 50% 30%, var(--primary-glow) 0%, transparent 70%)', 
                opacity: 0.15, 
                zIndex: -1,
                pointerEvents: 'none'
            }}></div>
            {/* Header */}
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '30px', padding: '8px 16px', fontSize: '0.8rem' }}>
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> BACK TO HOME
            </button>

            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>HOST <span style={{ color: 'var(--primary)' }}>TOURNAMENT</span></h1>
                <p style={{ color: 'var(--text-dim)' }}>Setup standard or multi-stage tournament series</p>
            </div>

            {/* Tournament Type Selector */}
            <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '30px', display: 'flex', gap: '12px' }}>
                <button 
                    className={tournamentType === 'Standard' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, padding: '14px' }}
                    onClick={() => setTournamentType('Standard')}
                >
                    <i className="fas fa-list-ol" style={{ marginRight: '8px' }}></i> STANDARD
                </button>
                <button 
                    className={tournamentType === 'Multi-Stage' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, padding: '14px' }}
                    onClick={() => setTournamentType('Multi-Stage')}
                >
                    <i className="fas fa-layer-group" style={{ marginRight: '8px' }}></i> MULTI-STAGE
                </button>
            </div>

            {tournamentType === 'Multi-Stage' && (
                <div className="glass" style={{ padding: '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Multi-Stage Configuration</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Qualifier Groups (Matches)</label>
                            <select 
                                className="form-control" 
                                value={stagedConfig.qualifierMatches}
                                onChange={e => setStagedConfig(prev => ({ ...prev, qualifierMatches: parseInt(e.target.value) }))}
                            >
                                {[1, 2, 3, 4, 5, 8, 10].map(n => <option key={n} value={n}>{n} Group{n > 1 ? 's' : ''}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Final Matches</label>
                            <select 
                                className="form-control" 
                                value={stagedConfig.finalMatches}
                                onChange={e => setStagedConfig(prev => ({ ...prev, finalMatches: parseInt(e.target.value) }))}
                            >
                                {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} Match{n > 1 ? 'es' : ''}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Include Semi-Final?</label>
                            <button 
                                className={stagedConfig.includeSemiFinal ? 'btn btn-primary' : 'btn btn-outline'}
                                style={{ padding: '8px 20px', fontSize: '0.8rem' }}
                                onClick={() => setStagedConfig(prev => ({ ...prev, includeSemiFinal: !prev.includeSemiFinal }))}
                            >
                                {stagedConfig.includeSemiFinal ? 'YES' : 'NO'}
                            </button>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px' }}>
                        Total Matches: <b>{stagedConfig.qualifierMatches + (stagedConfig.includeSemiFinal ? 1 : 0) + stagedConfig.finalMatches}</b> (Qualifiers + {stagedConfig.includeSemiFinal ? 'Semi + ' : ''}Finals)
                    </p>
                </div>
            )}

            {/* Basic Info */}
            <div className="glass" style={{ padding: '30px', borderRadius: '20px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-info-circle" style={{ color: 'var(--primary)' }}></i> Basic Details
                </h3>

                {/* Game Selection */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Select Game *</label>
                    <div className="wrap-mobile" style={{ gap: '12px' }}>
                        {GAMES.map(g => (
                            <button
                                key={g}
                                className={formData.game === g ? 'btn btn-primary' : 'btn btn-outline'}
                                style={{ flex: 1, padding: '12px', textTransform: 'uppercase', fontWeight: 700 }}
                                onClick={() => updateField('game', g)}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Profile Photo & Hoster Name */}
                <div className="grid-responsive" style={{ gap: '24px', marginBottom: '20px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Profile Photo (Optional)</label>
                        <input type="file" id="multiPhotoInput" style={{ display: 'none' }} onChange={handlePhotoChange} accept="image/*" />
                        <div
                            onClick={() => document.getElementById('multiPhotoInput').click()}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: '2px dashed var(--primary)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', overflow: 'hidden',
                                background: 'rgba(0,255,156,0.03)'
                            }}
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <i className="fas fa-camera" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                            )}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Hoster Name *</label>
                        <input className="form-control" placeholder="Your name" value={formData.hosterName} onChange={e => updateField('hosterName', e.target.value)} />
                    </div>
                </div>

                {/* Match Format */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Match Format *</label>
                    <div className="wrap-mobile" style={{ gap: '10px' }}>
                        {['Solo', 'Duo', 'Squad'].map(f => (
                            <button
                                key={f}
                                className={formData.format === f ? 'btn btn-primary' : 'btn btn-outline'}
                                style={{ flex: 1, padding: '10px', fontWeight: 700 }}
                                onClick={() => updateField('format', f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid-responsive" style={{ gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Tournament Name *</label>
                        <input className="form-control" placeholder="e.g., Night Series" value={formData.tournamentName} onChange={e => updateField('tournamentName', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>UPI ID *</label>
                        <input className="form-control" placeholder="your@upi" value={formData.upiId} onChange={e => updateField('upiId', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Entry Fee (₹) — covers all matches</label>
                        <input className="form-control" type="number" placeholder="e.g., 50" value={formData.entryFee} onChange={e => updateField('entryFee', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Prize Pool (₹)</label>
                        <input className="form-control" type="number" placeholder="e.g., 5000" value={formData.prizePool} onChange={e => updateField('prizePool', e.target.value)} />
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        <i className="fas fa-users" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>Teams Per Group *
                    </label>
                    <input className="form-control" type="number" min="1" max="100" placeholder="e.g., 25" value={formData.maxTeams} onChange={e => updateField('maxTeams', parseInt(e.target.value) || '')} style={{ maxWidth: '200px' }} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>Number of teams allowed per match/qualifier group</p>
                </div>

                {/* Registration Deadline */}
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: '#FFC107', fontWeight: 700 }}>
                        <i className="fas fa-hourglass-half" style={{ marginRight: '6px' }}></i> Registration Deadline (Optional)
                    </label>
                    <div className="grid-responsive" style={{ gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Deadline Date</label>
                            <input className="form-control" type="date" value={formData.registrationDeadlineDate} onChange={e => updateField('registrationDeadlineDate', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Deadline Time</label>
                            <input className="form-control" type="time" value={formData.registrationDeadlineTime} onChange={e => updateField('registrationDeadlineTime', e.target.value)} />
                        </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px' }}>Registration will close after this date & time. Leave empty for no deadline.</p>
                </div>

                {/* Match Day */}
                <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        Default Match Day * <span style={{ color: 'var(--primary)', marginLeft: '10px' }}>{formData.date || 'Not selected'}</span>
                    </label>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                        {dateChips.map(c => (
                            <div
                                key={c.fullDate}
                                onClick={() => updateField('date', c.fullDate)}
                                style={{
                                    padding: '10px 16px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                                    background: formData.date === c.fullDate ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: formData.date === c.fullDate ? '#000' : '#fff',
                                    border: formData.date === c.fullDate ? '1px solid var(--primary)' : '1px solid var(--border)',
                                    minWidth: '60px', transition: '0.3s'
                                }}
                            >
                                <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{c.day}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{c.dateNum}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Match Scheduling */}
            <div className="glass" style={{ padding: '30px', borderRadius: '20px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-clock" style={{ color: 'var(--primary)' }}></i> Match Scheduling
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>(1 hour per match)</span>
                </h3>

                <div className="grid-responsive" style={{ marginBottom: '24px' }}>
                    {tournamentType === 'Standard' ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Number of Matches</label>
                            <select
                                className="form-control"
                                value={formData.numberOfMatches}
                                onChange={e => updateField('numberOfMatches', parseInt(e.target.value))}
                                style={{ appearance: 'auto' }}
                            >
                                {[1, 2, 3, 4, 5, 6].map(n => (
                                    <option key={n} value={n}>{n} Match{n > 1 ? 'es' : ''}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Total Matches</label>
                            <div className="form-control" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                                {stagedConfig.qualifierMatches + (stagedConfig.includeSemiFinal ? 1 : 0) + 1} Matches
                            </div>
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>{tournamentType === 'Multi-Stage' ? 'Default First Match' : 'Default Start'} Time</label>
                        <input className="form-control" type="time" value={formData.overallStartTime} onChange={e => updateField('overallStartTime', e.target.value)} />
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Default Match Details Release Time</label>
                    <input
                        className="form-control"
                        type="time"
                        value={formData.matchDetailsReleaseTime}
                        onChange={e => updateField('matchDetailsReleaseTime', e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>Room ID / Password will be visible to registered players after this time</p>
                </div>

                {/* Auto-calculated 1-hour Time Slots with Map Selection */}
                {matchSlots.length > 0 && (
                    <div>
                        <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--primary)' }}>
                            <i className="fas fa-calendar-check" style={{ marginRight: '8px' }}></i>
                            Auto-Generated Match Slots
                        </h4>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {matchSlots.map(slot => (
                                <div
                                    key={slot.match}
                                    className="glass"
                                    style={{
                                        padding: '20px',
                                        border: '1px solid var(--border)',
                                        borderRadius: '14px',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'var(--primary)', color: '#000',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 900, fontSize: '0.9rem'
                                            }}>
                                                {slot.match}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{slot.stage || `Match ${slot.match}`}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                                            <i className="far fa-clock" style={{ color: 'var(--primary)' }}></i>
                                            <span style={{ fontWeight: 600, color: '#fff' }}>{slot.start}</span>
                                            <span>—</span>
                                            <span style={{ fontWeight: 600, color: '#fff' }}>{slot.end}</span>
                                            <span style={{ fontSize: '0.7rem', marginLeft: '8px', color: 'var(--primary)' }}>(1 hr)</span>
                                        </div>
                                    </div>
                                    <div className="grid-3-col" style={{ marginBottom: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                Match Date
                                            </label>
                                            <select 
                                                className="form-control" 
                                                style={{ fontSize: '0.8rem', padding: '8px' }}
                                                value={slot.date}
                                                onChange={e => updateSlotCustom(slot.match - 1, 'date', e.target.value)}
                                            >
                                                {dateChips.map(c => (
                                                    <option key={c.fullDate} value={c.fullDate}>
                                                        {c.day === 'Today' || c.day === 'Tmw' ? c.day : c.day} ({c.dateNum})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                Start Time
                                            </label>
                                            <input 
                                                className="form-control" 
                                                type="time" 
                                                style={{ fontSize: '0.8rem', padding: '8px' }}
                                                value={slot.start} 
                                                onChange={e => updateSlotCustom(slot.match - 1, 'start', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                Room Reveal
                                            </label>
                                            <input 
                                                className="form-control" 
                                                type="time" 
                                                style={{ fontSize: '0.8rem', padding: '8px' }}
                                                value={slot.release} 
                                                onChange={e => updateSlotCustom(slot.match - 1, 'release', e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    {/* Map selection per match */}
                                    {formData.game && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                                <i className="fas fa-map" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>Map
                                            </label>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {MAP_DATA[formData.game].map(m => (
                                                    <div
                                                        key={m}
                                                        onClick={() => setMatchMaps(prev => ({ ...prev, [slot.match]: m }))}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                                                            fontSize: '0.75rem', fontWeight: 600, transition: '0.2s',
                                                            background: matchMaps[slot.match] === m ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                            color: matchMaps[slot.match] === m ? '#000' : '#fff',
                                                            border: matchMaps[slot.match] === m ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                        }}
                                                    >
                                                        {m}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


            {/* Point System Configuration */}
            <div className="glass" style={{ padding: '30px', borderRadius: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <i className="fas fa-list-ol" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                    <h3 style={{ margin: 0 }}>Point System Configuration</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '25px' }}>
                    Define how points are awarded for kills and placement across this series.
                </p>
                
                <div className="form-group" style={{ maxWidth: '300px' }}>
                    <label className="form-label">Points Per Kill</label>
                    <input 
                        type="number" 
                        className="form-control" 
                        value={formData.pointSystem.kill} 
                        onChange={(e) => updateField('pointSystem', { ...formData.pointSystem, kill: parseInt(e.target.value) || 0 })}
                    />
                </div>

                <label className="form-label" style={{ marginTop: '20px', display: 'block' }}>Placement Points</label>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                    gap: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(r => (
                        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', width: '35px', color: 'var(--text-dim)', fontWeight: 600 }}>#{r}</span>
                            <input 
                                type="number" 
                                className="form-control" 
                                style={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}
                                value={formData.pointSystem[`rank_${r}`]}
                                onChange={(e) => updateField('pointSystem', { ...formData.pointSystem, [`rank_${r}`]: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Optional: YouTube & Description */}
            <div className="glass" style={{ padding: '30px', borderRadius: '20px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-pen" style={{ color: 'var(--primary)' }}></i> Optional Details
                </h3>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        <i className="fab fa-youtube" style={{ marginRight: '6px', color: '#FF0000' }}></i> YouTube Link
                    </label>
                    <input className="form-control" placeholder="https://youtube.com/@yourchannel" value={formData.youtubeLink} onChange={e => updateField('youtubeLink', e.target.value)} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Description / Rules</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Add match rules, prize distribution, or any extra info..."
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                    ></textarea>
                </div>
            </div>

            {/* Free Trial / Hosting Fee Banner */}
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

            {/* Navigation & Submit */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '20px', fontSize: '1rem', fontWeight: 800 }}
                    onClick={onBack}
                >
                    <i className="fas fa-arrow-left" style={{ marginRight: '10px' }}></i> BACK TO HOME
                </button>
                <button
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '20px', fontSize: '1.2rem', fontWeight: 800 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || isCheckingTrial}
                >
                    {isSubmitting || isCheckingTrial ? (
                        <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '10px' }}></i> {isSubmitting ? 'CREATING...' : 'CHECKING...'}</>
                    ) : isEligibleForFreeTrial ? (
                        <><i className="fas fa-check-circle" style={{ marginRight: '10px' }}></i> CREATE FOR FREE</>
                    ) : (
                        <><i className="fas fa-lock" style={{ marginRight: '10px' }}></i> PAY & CREATE SERIES</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default HostTournamentPage;
