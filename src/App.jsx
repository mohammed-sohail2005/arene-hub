import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TournamentList from './components/TournamentList';
import AboutSection from './components/AboutSection';
import HostIntegritySection from './components/HostIntegritySection';
import Footer from './components/Footer';
import HostModal from './components/HostModal';
import TournamentDetails from './components/TournamentDetails';
import HostTournamentPage from './components/HostTournamentPage';
import HostManagementPage from './components/HostManagementPage';
import TeamPortalPage from './components/TeamPortalPage';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ContactSection from './components/ContactSection';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import DirectRegisterPage from './components/DirectRegisterPage';
import NotFoundPage from './components/NotFoundPage';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

function App() {
    const [appLoaded, setAppLoaded] = useState(false);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [hostManageCode, setHostManageCode] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Dynamic SEO Management
    useEffect(() => {
        const seoData = {
            '/': {
                title: 'Arena Hub | Dominate the Battleground',
                description: 'The ultimate competitive platform for hosting and joining esports tournaments. Battle, rank up, and dominate BGMI, Free Fire, and more.'
            },
            '/details': {
                title: 'Tournament Details | Arena Hub',
                description: 'View match details, registration status, and maps for this tournament.'
            },
            '/multi-host': {
                title: 'Host a Tournament | Arena Hub',
                description: 'Create and manage professional esports tournaments with custom rules and prize pools.'
            },
            '/team-portal': {
                title: 'Team Portal | Arena Hub',
                description: 'Check your qualification status, match timing, and room details.'
            },
            '/privacy': {
                title: 'Privacy Policy | Arena Hub',
                description: 'How we handle and protect your data on the Arena Hub platform.'
            },
            '/terms': {
                title: 'Terms of Service | Arena Hub',
                description: 'Legal terms and tournament rules for hosts and players.'
            }
        };

        const currentSeo = seoData[location.pathname] || seoData['/'];
        document.title = currentSeo.title;
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', currentSeo.description);
        }
    }, [location.pathname]);

    // Check for Dodo Payments success callback
    useEffect(() => {
        const checkPaymentCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('payment') === 'success') {
                const urlHostCode = params.get('host_code');
                
                if (urlHostCode) {
                    try {
                        const { error, data } = await supabase
                            .from('tournaments')
                            .update({ host_code: urlHostCode })
                            .eq('host_code', `pending_${urlHostCode}`)
                            .select();

                        if (error) throw error;
                        
                        // Prevent multi-firing if they refresh the page
                        if (data && data.length > 0) {
                            toast.success(`🎉 Tournament Created Successfully!\n\nYour Host Code is: ${urlHostCode}\n\nPlease keep this safe!`, { duration: 10000 });
                        }

                        // Clear the URL params without reloading
                        window.history.replaceState({}, document.title, window.location.pathname);
                        
                    } catch (error) {
                        console.error('Failed to update tournament status after payment:', error);
                        toast.error('Payment successful, but failed to finalize your tournament status. Please contact support.', { duration: 8000 });
                    }
                }
                
                // Clean up any old localStorage data just to be safe
                if (localStorage.getItem('pending_tournament')) {
                     localStorage.removeItem('pending_tournament');
                }
            }
        };
        
        checkPaymentCallback();
    }, []);

    useEffect(() => {
        if (appLoaded && 'Notification' in window) {
            // Request notification permission when app finishes loading
            Notification.requestPermission().then((permission) => {

            });
        }
    }, [appLoaded]);

    const handleDetailsClick = (tournament) => {
        setSelectedTournament(tournament);
        navigate('/details');
        window.scrollTo(0, 0);
    };

    const handleBackToList = () => {
        navigate('/');
        setSelectedTournament(null);
        setHostManageCode('');
        window.scrollTo(0, 0);
    };

    const handleHostPageClick = () => {
        navigate('/multi-host');
        window.scrollTo(0, 0);
    };

    const handleHostManageClick = (code, tournament) => {
        setSelectedTournament(tournament);
        navigate(`/host-management/${code}`);
        window.scrollTo(0, 0);
    };

    const handleTeamPortalClick = () => {
        navigate('/team-portal');
        window.scrollTo(0, 0);
    };

    return (
        <>
            {!appLoaded && <SplashScreen onFinish={() => setAppLoaded(true)} />}
            <div className="app-container" style={{ opacity: appLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                <Navbar
                    onHostClick={() => setIsHostModalOpen(true)}
                    onHostPageClick={handleHostPageClick}
                    onTeamPortalClick={handleTeamPortalClick}
                />
                <ErrorBoundary>
                    <main>
                        <Routes>
                            <Route path="/" element={
                                <>
                                    <Hero onHostClick={() => setIsHostModalOpen(true)} onMultiClick={handleHostPageClick} />
                                    <TournamentList
                                        onDetailsClick={handleDetailsClick}
                                        onHostManageClick={handleHostManageClick}
                                    />
                                    <HostIntegritySection />
                                    <AboutSection />
                                    <ContactSection />
                                </>
                            } />

                            <Route path="/details" element={
                                <TournamentDetails
                                    tournament={selectedTournament}
                                    onBack={handleBackToList}
                                />
                            } />

                            <Route path="/multi-host" element={
                                <HostTournamentPage onBack={handleBackToList} />
                            } />

                            <Route path="/host-management/:code" element={
                                <HostManagementPage
                                    tournament={selectedTournament}
                                    onBack={handleBackToList}
                                />
                            } />

                            <Route path="/team-portal" element={
                                <TeamPortalPage onBack={handleBackToList} />
                            } />

                            <Route path="/register/:id" element={
                                <DirectRegisterPage onBack={handleBackToList} />
                            } />

                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </main>
                </ErrorBoundary>
                <Footer />

                <HostModal
                    isOpen={isHostModalOpen}
                    onClose={() => setIsHostModalOpen(false)}
                />
                <Toaster position="top-center" />
                <Analytics />
            </div>
        </>
    );
}

export default App;
