import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, CheckCircle } from 'lucide-react';
import { UserRole } from '../types';

const Profile = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">Loading profile...</div>;
    }

    if (!isAuthenticated || !user) return null;

    const roles = user.role === UserRole.ADMIN ? ['admin'] : ['user'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="relative">
                <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 border-indigo-50 mb-4 object-cover"
                />
                {roles.includes('admin') && (
                    <div className="absolute bottom-4 right-0 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Admin User">
                        <Shield className="w-4 h-4" />
                    </div>
                )}
            </div>

            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{user.email || user.phoneNumber}</p>

            {roles.length > 0 && (
                <div className="mb-4">
                    {roles.map(role => (
                        <span key={role} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase rounded-full mx-1">
                            {role}
                        </span>
                    ))}
                </div>
            )}

            {/* MFA Status Indicator */}
            <div className="mt-2 p-3 bg-green-50 rounded-lg text-sm text-green-700 w-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Authenticated via SecureCycle</span>
            </div>

            {/* Debug Info (Only visible in dev) */}
            <details className="mt-6 w-full text-left text-xs text-gray-400 bg-gray-50 p-2 rounded overflow-hidden">
                <summary className="cursor-pointer hover:text-gray-600">View Token Claims (Debug)</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                    {JSON.stringify(user, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default Profile;
