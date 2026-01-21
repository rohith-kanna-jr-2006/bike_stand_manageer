import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export const ContactUs = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Contact Us</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6 text-gray-600 leading-relaxed">
                    <p className="text-lg">
                        Have a question, concern, or feedback? We'd love to hear from you!
                        Our team is dedicated to providing you with the best support possible.
                    </p>

                    <div className="space-y-6 mt-8">
                        <div className="flex items-start">
                            <div className="bg-indigo-50 p-3 rounded-lg mr-4 text-indigo-600">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Email Us</h3>
                                <p className="text-sm mt-1">support@securepark.com</p>
                                <p className="text-sm text-gray-500 mt-1">We usually respond within 24 hours.</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="bg-emerald-50 p-3 rounded-lg mr-4 text-emerald-600">
                                <Phone className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Call Us</h3>
                                <p className="text-sm mt-1">+91 98765 43210</p>
                                <p className="text-sm text-gray-500 mt-1">Mon-Fri, 9:00 AM - 6:00 PM IST</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="bg-blue-50 p-3 rounded-lg mr-4 text-blue-600">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Visit Us</h3>
                                <p className="text-sm mt-1">
                                    123 Tech Park, Cyber City<br />
                                    Bangalore, Karnataka 560001
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Send a Message</h2>
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input type="text" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm" placeholder="Your Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea rows="4" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm" placeholder="How can we help?"></textarea>
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium transition-colors">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
