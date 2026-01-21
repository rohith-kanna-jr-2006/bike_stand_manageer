import React from 'react';

export const AboutUs = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">About Us</h1>

            <div className="space-y-6 text-gray-600 leading-relaxed">
                <p className="text-lg font-medium text-gray-800">
                    Welcome to SecurePark, your premier solution for modern, efficient, and secure parking management.
                </p>

                <p>
                    At SecurePark, we understand that finding a safe parking spot for your bike or car can be a daily hassle.
                    Whether you are a daily commuter, a shopper, or attending an event, the safety of your vehicle is paramount.
                    That's why we built a seamless digital platform connecting vehicle owners with secure parking spaces instantly.
                </p>

                <h2 className="text-xl font-bold text-gray-800 mt-8 mb-2">Our Mission</h2>
                <p>
                    Our mission is to digitize and simplify the parking experience in urban areas. We aim to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Reduce traffic congestion caused by parking searches.</li>
                    <li>Provide transparent and fair pricing for parking.</li>
                    <li>Ensure the highest security standards for your vehicles.</li>
                    <li>Enable parking stand owners to manage their inventory efficiently.</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-800 mt-8 mb-2">Why Choose Us?</h2>
                <p>
                    We leverage cutting-edge technology including real-time availability tracking, QR-code based entry/exit,
                    and secure digital payments to provide a friction-free experience.
                </p>
            </div>
        </div>
    );
};
