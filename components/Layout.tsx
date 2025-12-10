import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield, Menu, Bell, Settings, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'settings';
  onNavigate: (view: 'dashboard' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => onNavigate('dashboard')}
            >
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">SecureCycle</span>
              <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                {user?.role === 'admin' ? 'Owner Portal' : 'Customer App'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
               <button 
                 onClick={() => onNavigate(currentView === 'dashboard' ? 'settings' : 'dashboard')}
                 className={`p-2 rounded-full transition-colors ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'}`}
                 title={currentView === 'dashboard' ? "Settings" : "Dashboard"}
               >
                 {currentView === 'dashboard' ? <Settings className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
               </button>
               
               <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

               <div className="flex items-center">
                 <span className="text-sm font-medium text-gray-700 mr-3 hidden sm:block">{user?.name}</span>
                 <button 
                    onClick={logout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                 >
                   <LogOut className="h-4 w-4" />
                   <span className="hidden sm:inline">Logout</span>
                 </button>
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};