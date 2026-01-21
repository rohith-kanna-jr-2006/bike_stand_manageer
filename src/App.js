import React, { useState } from 'react';
import { AuthProviderWrapper, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { AddStandPage } from './pages/AddStandPage';
import { Layout } from './components/Layout';
import { Layout } from './components/Layout';
import { UserRole } from './types';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AboutUs } from './pages/legal/AboutUs';
import { ContactUs } from './pages/legal/ContactUs';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { Terms } from './pages/legal/Terms';
import { RefundPolicy } from './pages/legal/RefundPolicy';

const AppContent = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [view, setView] = useState('dashboard');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading SecurePark...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <Layout currentView={view === 'add-stand' ? 'dashboard' : view} onNavigate={setView}>
            {view === 'settings' ? (
                <SettingsPage />
            ) : view === 'add-stand' ? (
                <AddStandPage onBack={() => setView('dashboard')} />
            ) : view === 'about-us' ? (
                <AboutUs />
            ) : view === 'contact-us' ? (
                <ContactUs />
            ) : view === 'privacy-policy' ? (
                <PrivacyPolicy />
            ) : view === 'terms' ? (
                <Terms />
            ) : view === 'refund-policy' ? (
                <RefundPolicy />
            ) : user?.role === UserRole.ADMIN ? (
                <AdminDashboard onNavigate={setView} />
            ) : (
                <UserDashboard onNavigate={setView} />
            )}
        </Layout>
    );
};

const App = () => {
    // NOTE: Get this from Google Cloud Console.
    // We default to the environment variable REACT_APP_GOOGLE_CLIENT_ID
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProviderWrapper>
                <ConfigProvider>
                    <AppContent />
                </ConfigProvider>
            </AuthProviderWrapper>
        </GoogleOAuthProvider>
    );
};

export default App;
