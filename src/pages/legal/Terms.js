import React from 'react';

export const Terms = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: January 01, 2026</p>

            <div className="prose prose-indigo max-w-none text-gray-600">
                <p>
                    Welcome to SecurePark! By accessing or using our website and services, you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these terms, you may not access the service.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">1. Use of Service</h3>
                <p>
                    You agree to use SecurePark only for lawful purposes. You must not use the service to transmit any harmful code or interfere with the operation of the service.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">2. Accounts</h3>
                <p>
                    When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">3. Bookings and Payments</h3>
                <p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>All bookings are subject to availability.</li>
                        <li>Payments must be made via the accepted payment methods (Cash/UPI/Cards).</li>
                        <li>Prices are set by the parking stand owners and SecurePark facilitates the transaction. We reserve the right to change our service fees at any time.</li>
                    </ul>
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">4. User Responsibilities</h3>
                <p>
                    You are responsible for parking your vehicle correctly in the designated spot. SecurePark is not liable for any theft or damage to the vehicle, although we strive to ensure stand owners maintain high security standards.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">5. Limitation of Liability</h3>
                <p>
                    In no event shall SecurePark, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">6. Changes</h3>
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
                </p>
            </div>
        </div>
    );
};
