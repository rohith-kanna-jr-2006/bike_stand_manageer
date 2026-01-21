import React from 'react';

export const RefundPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancellation & Refund Policy</h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: January 01, 2026</p>

            <div className="prose prose-indigo max-w-none text-gray-600">
                <p>
                    At SecurePark, we strive to ensure a smooth booking experience. However, we understand that plans can change. This policy outlines the terms for cancellations and refunds.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">1. Cancellation by User</h3>
                <p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>
                            <strong>Before Check-In:</strong> You can cancel your parking booking at any time before the scheduled check-in time.
                        </li>
                        <li>
                            <strong>After Check-In:</strong> Once checked in (ticket is active), the booking cannot be cancelled effectively as the service has commenced. You must proceed to 'Checkout' to end the session.
                        </li>
                    </ul>
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">2. Refunds</h3>
                <p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>
                            <strong>Online Payments (Pre-paid):</strong> If you cancel a pre-paid booking <em>before</em> check-in, a refund will be initiated to your original payment method within 5-7 business days. A small processing fee may be deducted.
                        </li>
                        <li>
                            <strong>Double Payment:</strong> If you were charged twice for the same booking due to a technical error, the extra amount will be automatically refunded within 5-7 business days.
                        </li>
                        <li>
                            <strong>Service Failure:</strong> If the parking spot booked is unavailable upon arrival, please contact support immediately for a full refund.
                        </li>
                    </ul>
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">3. Non-Refundable Scenarios</h3>
                <p>
                    Refunds will <strong>not</strong> be provided in the following cases:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>If the user forgets to check out and the timer continues running.</li>
                        <li>If the user violates the parking facility's rules and regulations causing termination of service.</li>
                    </ul>
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">4. Contact Used</h3>
                <p>
                    For any billing or refund related queries, please contact us at support@securepark.com with your Booking/Ticket ID.
                </p>
            </div>
        </div>
    );
};
