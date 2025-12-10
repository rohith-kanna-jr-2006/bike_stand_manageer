import React from 'react';

export const Input = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full rounded-lg border 
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} 
            bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 
            transition-colors duration-200
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600 animate-pulse">
                    {error}
                </p>
            )}
        </div>
    );
};
