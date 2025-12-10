import React from 'react';
import { CheckCircle, Ticket, X } from 'lucide-react';
import { Button } from './ui/Button';

export const BookingSuccess = ({ onShowTicket, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative p-6 flex flex-col items-center text-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_ease-out]">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-500 mb-8">
                    Your parking spot has been successfully reserved.
                </p>

                <Button onClick={onShowTicket} className="w-full py-3 text-lg flex items-center justify-center">
                    <Ticket className="w-5 h-5 mr-2" />
                    Show Ticket
                </Button>
            </div>
        </div>
    );
};
