import React from 'react';

export const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: January 01, 2026</p>

            <div className="prose prose-indigo max-w-none text-gray-600">
                <p>
                    SecurePark ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by SecurePark.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">1. Information We Collect</h3>
                <p>
                    We collect information to provide better services to all our users.
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Personal Information:</strong> Name, Email address, Phone number, Vehicle number.</li>
                        <li><strong>Usage Data:</strong> Information on how you use the web app, booking history, and preferences.</li>
                        <li><strong>Location Data:</strong> To show nearby parking stands (only with your permission).</li>
                    </ul>
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">2. How We Use Your Information</h3>
                <p>
                    We use the information we collect in various ways, including to:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Provide, operate, and maintain our booking platform.</li>
                        <li>Improve, personalize, and expand our services.</li>
                        <li>Process your transactions and manage your bookings.</li>
                        <li>Send you emails/notifications regarding updates, security alerts, and support.</li>
                    </ul>
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">3. Data Security</h3>
                <p>
                    We implement appropriate technical and organizational security measures to protect your personal data against accidental or unlawful destruction, loss, alteration, or unauthorized disclosure/access.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">4. Third-Party Services</h3>
                <p>
                    We may employ third-party companies (like Payment Gateways - Razorpay) and individuals to facilitate our Service.
                    These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">5. Changes to This Policy</h3>
                <p>
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                </p>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">6. Contact Us</h3>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at support@securepark.com.
                </p>
            </div>
        </div>
    );
};
