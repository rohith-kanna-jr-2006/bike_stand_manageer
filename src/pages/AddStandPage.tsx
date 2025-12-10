import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';

declare var google: any;

// Define the view prop type to match App.tsx's expectation if we were to pass it, 
// but here we just need a way to go back.
interface AddStandPageProps {
    onBack: () => void;
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

export const AddStandPage: React.FC<AddStandPageProps> = ({ onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        address: '',
        phone: ''
    });
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setPosition({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            });
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!position) {
            setMessage({ type: 'error', text: 'Please click on the map to select a location.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const payload = {
                name: formData.name,
                capacity: Number(formData.capacity),
                availableSpots: Number(formData.capacity), // Initial availability
                location: position,
                address: formData.address,
                contact: {
                    phone: formData.phone
                },
                status: 'active',
                createdAt: Timestamp.now()
            };

            await addDoc(collection(db, 'stands'), payload);

            setMessage({ type: 'success', text: 'Bike Stand registered successfully!' });
            setFormData({ name: '', capacity: '', address: '', phone: '' });
            setPosition(null);

            // Optional: Navigate back after success
            // setTimeout(onBack, 2000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to register stand. Try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center">
                <button
                    onClick={onBack}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Add New Bike Stand</h2>
                    <p className="text-sm text-gray-500">Register a new location in the system</p>
                </div>
            </div>

            <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">

                    {/* Form Section */}
                    <div className="p-6 md:w-1/2 overflow-y-auto">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg text-sm font-medium flex items-center ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stand Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Central Station Rack"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address / Landmark</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Near Main Entrance"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        placeholder="20"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                                    <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center">
                                        <MapPin className="h-4 w-4 mr-2" /> Selected Location
                                    </h4>
                                    {position ? (
                                        <div className="text-xs text-indigo-700 grid grid-cols-2 gap-2">
                                            <div>Lat: <span className="font-mono">{position.lat.toFixed(6)}</span></div>
                                            <div>Lng: <span className="font-mono">{position.lng.toFixed(6)}</span></div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-indigo-500 italic">No location selected. Click on the map.</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !position}
                                    className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-sm transition duration-200 flex items-center justify-center
                                ${loading || !position
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Registering...
                                        </>
                                    ) : 'Register Stand'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Map Section */}
                    <div className="md:w-1/2 h-96 md:h-auto bg-gray-100 relative border-t md:border-t-0 md:border-l border-gray-200">
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={defaultCenter}
                            zoom={13}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            onClick={onMapClick}
                            options={{
                                disableDefaultUI: false,
                                streetViewControl: false,
                                mapTypeControl: false
                            }}
                        >
                            {position && <Marker position={position} />}
                        </GoogleMap>

                        <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-600 pointer-events-none">
                            Click anywhere on the map to pin the stand's location.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
