import React from 'react';

const Footer = ({ onNavigate }) => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-12 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">SecurePark</h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                            Your trusted partner for secure and efficient bike and car parking management.
                            Experience hassle-free parking with our advanced digital solutions.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><button onClick={() => onNavigate('privacy-policy')} className="hover:text-indigo-600 transition-colors">Privacy Policy</button></li>
                            <li><button onClick={() => onNavigate('terms')} className="hover:text-indigo-600 transition-colors">Terms & Conditions</button></li>
                            <li><button onClick={() => onNavigate('refund-policy')} className="hover:text-indigo-600 transition-colors">Cancellation & Refund Policy</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><button onClick={() => onNavigate('about-us')} className="hover:text-indigo-600 transition-colors">About Us</button></li>
                            <li><button onClick={() => onNavigate('contact-us')} className="hover:text-indigo-600 transition-colors">Contact Us</button></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} SecurePark. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        {/* Social icons could go here */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
