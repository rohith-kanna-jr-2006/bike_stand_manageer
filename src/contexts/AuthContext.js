import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const AuthProviderWrapper = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    // Verify token with backend (optional, or just decode if we trust local storage for UI)
                    // For now, we'll assume valid if present and try to fetch user details
                } catch (e) {
                    console.error("Auth restoration failed", e);
                    localStorage.removeItem('authToken');
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback((userData) => {
        if (userData) {
            // Direct login (from LoginPage)
            setUser(userData);
            setIsLoading(false);
        } else {
            // Redirect to login (if called without args)
            window.location.href = '/login';
        }
    }, []);

    const logout = useCallback(() => {
        setIsLoading(true);
        localStorage.removeItem('authToken');
        setTimeout(() => {
            setUser(null);
            setIsLoading(false);
            window.location.href = '/';
        }, 500);
    }, []);

    const updateProfile = useCallback((updates) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    const getAccessToken = useCallback(async () => {
        return localStorage.getItem('authToken') || "";
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            updateProfile,
            getAccessToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProviderWrapper');
    }
    return context;
};
