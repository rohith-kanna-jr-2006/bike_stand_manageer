import React, { useState } from 'react';
import { AuthProviderWrapper, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { AddStandPage } from './pages/AddStandPage';
import { Layout } from './components/Layout';
import { UserRole } from './types';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AppContent = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [view, setView] = useState('dashboard');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading SecureCycle...</p>
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
            ) : user?.role === UserRole.ADMIN ? (
                <AdminDashboard onNavigate={setView} />
            ) : (
                <UserDashboard onNavigate={setView} />
            )}
        </Layout>
    );
};

const App = () => {
    // NOTE: Replace with your actual Client ID from Google Cloud Console
    // In a real app, use process.env.REACT_APP_GOOGLE_CLIENT_ID
    const GOOGLE_CLIENT_ID = "219242650520-o09v8htnbkujp3iferc8l00938po0mvm.apps.googleusercontent.com";

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
