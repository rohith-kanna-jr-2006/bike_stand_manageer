import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConfigContext } from '../contexts/ConfigContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    IndianRupee, Activity, AlertTriangle,
    Map as MapIcon, FileText, ChevronRight, X,
    MapPin, Search, Phone, FileBadge, Tag, LocateFixed, Globe, List, CheckSquare, Square, CheckCircle, Plus, Filter, Edit2, Trash2, AlertCircle, Mail, Calendar, Clock, Bike, Car
} from 'lucide-react';
import { standService, bookingService } from '../services/api';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b'];

const StatCard = ({ title, value, icon, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                {icon}
            </div>
        </div>
    </div>
);

export const AdminDashboard = ({ onNavigate }) => {
    const { user } = useAuth();
    const config = useContext(ConfigContext);

    // Features State
    const [viewMode, setViewMode] = useState('list');
    const [selectedStandIds, setSelectedStandIds] = useState([]);
    const mapRef = useRef(null);

    // Stand Management State
    const [stands, setStands] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Analytics State
    const [analytics, setAnalytics] = useState({
        revenue: 0,
        activeParking: 0,
        todaysTraffic: 0
    });

    // Chart Data State
    const [revenueChartData, setRevenueChartData] = useState([]);
    const [utilizationChartData, setUtilizationChartData] = useState([]);

    // Fetch Stands from Backend
    const fetchStands = async () => {
        if (!user) return;
        try {
            const response = await standService.getAll(user.id);
            // Map _id to id and transform GeoJSON location to simple lat/lng for frontend
            const standsData = response.data.map((s) => ({
                ...s,
                id: s._id,
                location: {
                    lat: s.location?.coordinates?.[1] || 0,
                    lng: s.location?.coordinates?.[0] || 0
                }
            }));
            setStands(standsData);

            // Calculate Utilization Chart Data
            const activeStands = standsData.filter((s) => s.status === 'active');
            const maintenanceStands = standsData.filter((s) => s.status === 'maintenance');

            const occupied = activeStands.reduce((acc, s) => acc + (s.capacity - s.availableSpots), 0);
            const available = activeStands.reduce((acc, s) => acc + s.availableSpots, 0);
            const maintenance = maintenanceStands.reduce((acc, s) => acc + s.capacity, 0);

            const total = occupied + available + maintenance;
            if (total === 0) {
                setUtilizationChartData([{ name: 'Available', value: 100 }]);
            } else {
                setUtilizationChartData([
                    { name: 'Occupied', value: occupied },
                    { name: 'Available', value: available },
                    { name: 'Maintenance', value: maintenance }
                ].filter(d => d.value > 0));
            }
        } catch (error) {
            console.error("Error fetching stands:", error);
        }
    };

    useEffect(() => {
        fetchStands();
    }, [user]);

    // Fetch Bookings & Calculate Analytics
    const fetchBookings = async () => {
        if (!user) return;
        try {
            const allBookings = [];

            if (stands.length > 0) {
                const promises = stands.map(stand => bookingService.getStandBookings(stand.id));
                const results = await Promise.all(promises);
                results.forEach(res => {
                    if (res.success) allBookings.push(...res.data);
                });
            }

            // Map _id to id and ensure standId is set
            const bookingsData = allBookings.map((b) => ({
                ...b,
                id: b._id,
                standId: b.stand || b.standId
            }));

            bookingsData.sort((a, b) => {
                const dateA = new Date(a.startTime);
                const dateB = new Date(b.startTime);
                return dateB.getTime() - dateA.getTime();
            });

            setBookings(bookingsData);

            // Calculate Analytics Overview
            let revenue = 0;
            let active = 0;
            let traffic = 0;
            const today = new Date().toDateString();

            bookingsData.forEach(booking => {
                if (booking.status === 'completed' && booking.totalAmount) {
                    revenue += booking.totalAmount;
                }
                if (booking.status === 'active') active++;

                const bookingDate = new Date(booking.startTime);
                if (bookingDate.toDateString() === today) {
                    traffic++;
                }
            });

            setAnalytics({
                revenue,
                activeParking: active,
                todaysTraffic: traffic
            });

            // Calculate Revenue Chart Data (Last 7 Days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });

            const chartData = last7Days.map(date => {
                const dayStr = date.toDateString();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                const dailyTotal = bookingsData.reduce((acc, b) => {
                    const bDate = new Date(b.startTime);
                    if (bDate.toDateString() === dayStr && b.status === 'completed' && b.totalAmount) {
                        return acc + b.totalAmount;
                    }
                    return acc;
                }, 0);

                return { name: dayName, revenue: dailyTotal };
            });
            setRevenueChartData(chartData);

        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    useEffect(() => {
        if (stands.length > 0) {
            fetchBookings();
        }
    }, [stands, user]);

    // Search State for Monitor Map
    const [monitorSearchQuery, setMonitorSearchQuery] = useState('');

    const [showStandModal, setShowStandModal] = useState(false);
    const [editingStand, setEditingStand] = useState(null);

    // View Bookings State
    const [showBookingsModal, setShowBookingsModal] = useState(false);
    const [viewBookingsStand, setViewBookingsStand] = useState(null);

    // Form State
    const [newStandName, setNewStandName] = useState('');
    const [newStandCapacity, setNewStandCapacity] = useState('20');
    const [newStandLoc, setNewStandLoc] = useState(null);
    const [newStandAddress, setNewStandAddress] = useState('');

    // New Fields
    const [newStandPhone, setNewStandPhone] = useState('');
    const [newStandEmail, setNewStandEmail] = useState('');
    const [newStandLicense, setNewStandLicense] = useState('');
    const [newStandRates, setNewStandRates] = useState({ bike: '25', car: '50' });

    // Google Map Refs
    const googleMapInstance = useRef(null);
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);

    // Filter Stands based on search query
    const filteredStands = useMemo(() => {
        if (!monitorSearchQuery) return stands;
        const query = monitorSearchQuery.toLowerCase();
        return stands.filter(stand =>
            stand.name.toLowerCase().includes(query) ||
            (stand.address && stand.address.toLowerCase().includes(query))
        );
    }, [stands, monitorSearchQuery]);

    // Filter Bookings for the selected stand
    const filteredBookings = useMemo(() => {
        if (!viewBookingsStand) return [];
        // Match booking.standId with the selected stand's ID
        return bookings.filter(b => b.standId === viewBookingsStand.id);
    }, [bookings, viewBookingsStand]);

    // Helper to open edit modal
    const handleEditStandClick = (stand) => {
        setEditingStand(stand);
        setNewStandName(stand.name);
        setNewStandCapacity(stand.capacity.toString());
        setNewStandLoc({ lat: stand.location.lat, lng: stand.location.lng });
        setNewStandAddress(stand.address || '');
        setNewStandPhone(stand.contact?.phone || '');
        setNewStandEmail(stand.contact?.email || '');
        setNewStandLicense(stand.contact?.license || '');
        setNewStandRates({
            bike: stand.rates?.bike.toString() || '25',
            car: stand.rates?.car.toString() || '50'
        });
        setShowStandModal(true);
    };

    // Helper to delete stand
    const handleDeleteStand = async (standId) => {
        if (!window.confirm("Are you sure you want to delete this stand? This action cannot be undone.")) {
            return;
        }

        try {
            await standService.delete(standId);
            if (selectedStandIds.includes(standId)) {
                setSelectedStandIds(prev => prev.filter(id => id !== standId));
            }
            fetchStands(); // Refresh list
        } catch (error) {
            console.error("Error deleting stand:", error);
            alert("Failed to delete stand.");
        }
    };

    // Helper to open bookings modal
    const handleViewBookings = (stand) => {
        setViewBookingsStand(stand);
        setShowBookingsModal(true);
    };

    // Bulk Actions Logic
    const handleSelectAll = () => {
        if (selectedStandIds.length === filteredStands.length) {
            setSelectedStandIds([]);
        } else {
            setSelectedStandIds(filteredStands.map(s => s.id));
        }
    };

    const handleSelectStand = (id) => {
        if (selectedStandIds.includes(id)) {
            setSelectedStandIds(selectedStandIds.filter(sid => sid !== id));
        } else {
            setSelectedStandIds([...selectedStandIds, id]);
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedStandIds.length === 0) return;

        const confirmMsg = `Are you sure you want to set ${selectedStandIds.length} stands to ${status}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const promises = selectedStandIds.map(id =>
                standService.update(id, { status })
            );
            await Promise.all(promises);
            setSelectedStandIds([]);
            alert(`Successfully updated ${selectedStandIds.length} stands to ${status}.`);
            fetchStands(); // Refresh list
        } catch (error) {
            console.error("Bulk update failed:", error);
            alert("Failed to update some stands.");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedStandIds.length === 0) return;

        const confirmMsg = `Are you sure you want to PERMANENTLY DELETE ${selectedStandIds.length} stands? This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const promises = selectedStandIds.map(id =>
                standService.delete(id)
            );
            await Promise.all(promises);
            setSelectedStandIds([]);
            fetchStands(); // Refresh list
        } catch (error) {
            console.error("Bulk delete failed:", error);
            alert("Failed to delete some stands.");
        }
    };

    // Helper to open add modal (reset form)
    const handleOpenAddModal = () => {
        setEditingStand(null);
        setNewStandName('');
        setNewStandCapacity('20');
        setNewStandLoc(null);
        setNewStandAddress('');
        setNewStandPhone('');
        setNewStandEmail('');
        setNewStandLicense('');
        setNewStandRates({ bike: '25', car: '50' });
        setShowStandModal(true);
    };

    // Initialize Monitor Map
    useEffect(() => {
        const initMonitorMap = async () => {
            if (viewMode === 'map' && mapRef.current) {
                if (!googleMapInstance.current && typeof window.google !== 'undefined') {
                    try {
                        const { Map } = await window.google.maps.importLibrary("maps");
                        const { Marker } = await window.google.maps.importLibrary("marker");

                        const center = { lat: 28.6139, lng: 77.2090 };

                        googleMapInstance.current = new Map(mapRef.current, {
                            center: center,
                            zoom: 12,
                            mapId: 'ADMIN_MONITOR_MAP',
                            disableDefaultUI: false,
                        });

                        // Initialize Shared InfoWindow
                        infoWindowRef.current = new window.google.maps.InfoWindow({
                            minWidth: 220
                        });

                    } catch (e) {
                        console.error("Error loading Google Maps:", e);
                        return;
                    }
                }

                if (googleMapInstance.current) {
                    // Clear existing markers
                    markersRef.current.forEach(marker => marker.setMap(null));
                    markersRef.current = [];

                    filteredStands.forEach(stand => {
                        const marker = new window.google.maps.Marker({
                            position: { lat: stand.location.lat, lng: stand.location.lng },
                            map: googleMapInstance.current,
                            title: stand.name,
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: stand.availableSpots > 0 ? "#10b981" : "#ef4444",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "#ffffff",
                            }
                        });

                        marker.addListener("click", () => {
                            // Create InfoWindow Content
                            const contentDiv = document.createElement('div');
                            contentDiv.style.padding = '8px';
                            contentDiv.style.fontFamily = "'Inter', sans-serif";
                            contentDiv.innerHTML = `
                                <div style="margin-bottom: 8px;">
                                    <strong style="font-size:16px; display:block; margin-bottom:4px; color:#111827;">${stand.name}</strong>
                                    <span style="font-size:13px; color: #6b7280; display:block; line-height:1.4;">${stand.address || 'No address'}</span>
                                </div>
                                <div style="font-size:13px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; background:#f9fafb; padding:8px; rounded:6px;">
                                    <span style="color:#374151;">Capacity: <strong>${stand.availableSpots}/${stand.capacity}</strong></span>
                                    <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background-color: ${stand.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${stand.status === 'active' ? '#166534' : '#92400e'};">
                                        ${stand.status === 'active' ? 'Active' : 'Maintenance'}
                                    </span>
                                </div>
                            `;

                            const actionsDiv = document.createElement('div');
                            actionsDiv.style.display = 'flex';
                            actionsDiv.style.gap = '8px';

                            // Edit Button
                            const editBtn = document.createElement('button');
                            editBtn.textContent = 'Edit';
                            editBtn.style.flex = '1';
                            editBtn.style.padding = '6px 12px';
                            editBtn.style.backgroundColor = '#4f46e5';
                            editBtn.style.color = 'white';
                            editBtn.style.border = 'none';
                            editBtn.style.borderRadius = '6px';
                            editBtn.style.fontSize = '12px';
                            editBtn.style.cursor = 'pointer';
                            editBtn.style.fontWeight = '500';
                            editBtn.onclick = () => {
                                if (infoWindowRef.current) infoWindowRef.current.close();
                                handleEditStandClick(stand);
                            };

                            // View List Button
                            const listBtn = document.createElement('button');
                            listBtn.textContent = 'View in List';
                            listBtn.style.flex = '1';
                            listBtn.style.padding = '6px 12px';
                            listBtn.style.backgroundColor = '#ffffff';
                            listBtn.style.color = '#374151';
                            listBtn.style.border = '1px solid #d1d5db';
                            listBtn.style.borderRadius = '6px';
                            listBtn.style.fontSize = '12px';
                            listBtn.style.cursor = 'pointer';
                            listBtn.style.fontWeight = '500';
                            listBtn.onclick = () => {
                                if (infoWindowRef.current) infoWindowRef.current.close();
                                setSelectedStandIds([stand.id]);
                                setViewMode('list');
                            };

                            actionsDiv.appendChild(editBtn);
                            actionsDiv.appendChild(listBtn);
                            contentDiv.appendChild(actionsDiv);

                            if (infoWindowRef.current) {
                                infoWindowRef.current.setContent(contentDiv);
                                infoWindowRef.current.open(googleMapInstance.current, marker);
                            }

                            // Pan to marker
                            googleMapInstance.current.panTo(marker.getPosition());

                            // Also select in list
                            setSelectedStandIds([stand.id]);
                        });

                        markersRef.current.push(marker);
                    });
                }
            }
        };

        initMonitorMap();
    }, [viewMode, filteredStands, monitorSearchQuery]);

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setNewStandLoc({ lat: latitude, lng: longitude });
                    setNewStandAddress("📍 Current Device Location");
                },
                (error) => {
                    alert("Could not access location. Please enter coordinates manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleSaveStand = async () => {
        if (!user) return;

        // Validation with Alerts
        if (!newStandName.trim()) {
            alert("Please enter a name for the stand.");
            return;
        }
        if (!newStandPhone.trim()) {
            alert("Please enter a contact phone number.");
            return;
        }
        // Location validation removed per user request

        const standData = {
            name: newStandName,
            address: newStandAddress,
            location: {
                type: 'Point',
                coordinates: [newStandLoc?.lng || 0, newStandLoc?.lat || 0]
            },
            capacity: parseInt(newStandCapacity) || 0,
            availableSpots: parseInt(newStandCapacity) || 0, // Initially full capacity available
            status: 'active',
            ownerId: user.id,
            contact: {
                phone: newStandPhone,
                email: newStandEmail,
                license: newStandLicense
            },
            rates: {
                bike: parseFloat(newStandRates.bike),
                car: parseFloat(newStandRates.car)
            }
        };

        try {
            if (editingStand) {
                // Update Existing Stand
                await standService.update(editingStand.id, standData);
            } else {
                // Add New Stand
                await standService.create(standData);
            }

            setShowStandModal(false);
            setEditingStand(null);
            fetchStands(); // Refresh list
        } catch (error) {
            console.error("Error saving stand:", error);
            alert("Failed to save stand. See console for details.");
        }
    };

    return (
        <div className="space-y-6">

            {/* Add/Edit Stand Modal */}
            {showStandModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                                {editingStand ? 'Edit Stand Details' : 'Register New Stand'}
                            </h3>
                            <button onClick={() => setShowStandModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Basic Details */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                        <FileText className="h-4 w-4 mr-2" /> Basic Details
                                    </h4>
                                    <div className="space-y-4">
                                        <Input
                                            label="Stand Name"
                                            placeholder="e.g. Westside Mall Parking"
                                            value={newStandName}
                                            onChange={(e) => setNewStandName(e.target.value)}
                                        />

                                        <Input
                                            label="Address Label"
                                            placeholder="e.g. 123 Main St, City"
                                            value={newStandAddress}
                                            onChange={(e) => setNewStandAddress(e.target.value)}
                                            icon={<MapPin className="h-4 w-4 text-gray-400" />}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Capacity"
                                                type="number"
                                                placeholder="50"
                                                value={newStandCapacity}
                                                onChange={(e) => setNewStandCapacity(e.target.value)}
                                            />
                                            <Input
                                                label="License No."
                                                placeholder="LIC-12345"
                                                value={newStandLicense}
                                                onChange={(e) => setNewStandLicense(e.target.value)}
                                                icon={<FileBadge className="h-4 w-4" />}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Contact & Coordinates */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                        <Phone className="h-4 w-4 mr-2" /> Contact Info
                                    </h4>
                                    <div className="space-y-4">
                                        <Input
                                            label="Phone Number (Mandatory)"
                                            placeholder="+91 98765 43210"
                                            value={newStandPhone}
                                            onChange={(e) => setNewStandPhone(e.target.value)}
                                            icon={<Phone className="h-4 w-4" />}
                                            className={!newStandPhone ? "border-red-300" : ""}
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            placeholder="manager@parking.com"
                                            value={newStandEmail}
                                            onChange={(e) => setNewStandEmail(e.target.value)}
                                            icon={<Mail className="h-4 w-4" />}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                        <Tag className="h-4 w-4 mr-2" /> Hourly Rates (₹)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Bike Rate</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <IndianRupee className="h-3 w-3" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={newStandRates.bike}
                                                    onChange={(e) => setNewStandRates({ ...newStandRates, bike: e.target.value })}
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Car Rate</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <IndianRupee className="h-3 w-3" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={newStandRates.car}
                                                    onChange={(e) => setNewStandRates({ ...newStandRates, car: e.target.value })}
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowStandModal(false)}>Cancel</Button>
                            <Button onClick={handleSaveStand}>
                                {editingStand ? 'Update Stand Details' : 'Register Stand'}
                            </Button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* View Bookings Modal */}
            {
                showBookingsModal && viewBookingsStand && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center">
                                        <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                                        Stand Bookings
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5 ml-7">
                                        Viewing history for <span className="font-semibold text-gray-800">{viewBookingsStand.name}</span>
                                    </p>
                                </div>
                                <button onClick={() => setShowBookingsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                {filteredBookings.length > 0 ? (
                                    <table className="w-full text-left text-sm text-gray-600">
                                        <thead className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider sticky top-0 border-b border-gray-100 z-10">
                                            <tr>
                                                <th className="px-6 py-4">Booking ID / User</th>
                                                <th className="px-6 py-4">Vehicle</th>
                                                <th className="px-6 py-4">Time</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredBookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">
                                                            {booking.ticketId ? (
                                                                <span className="font-mono bg-indigo-50 px-2 py-1 rounded text-indigo-700 text-xs border border-indigo-100">
                                                                    {booking.ticketId}
                                                                </span>
                                                            ) : (
                                                                `#${booking.id.slice(0, 8)}`
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">User: {booking.userName || booking.userId}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            {booking.vehicleType === 'car' ? (
                                                                <div className="bg-blue-100 p-1.5 rounded text-blue-600 mr-3"><Car className="h-4 w-4" /></div>
                                                            ) : (
                                                                <div className="bg-indigo-100 p-1.5 rounded text-indigo-600 mr-3"><Bike className="h-4 w-4" /></div>
                                                            )}
                                                            <span className="capitalize text-gray-700">{booking.vehicleType}</span>
                                                            {booking.vehicleNumber && <span className="ml-2 text-xs text-gray-400">({booking.vehicleNumber})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-gray-900">
                                                            <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                            {new Date(booking.startTime).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500 mt-1 ml-5.5 pl-0.5">
                                                            <Clock className="h-3 w-3 mr-1.5" />
                                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${booking.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : (booking.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600')
                                                            }`}>
                                                            {booking.status === 'active' ? 'Active' : (booking.status === 'cancelled' ? 'Cancelled' : 'Completed')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                        ₹{booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                                            <FileText className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <p className="font-medium text-gray-900">No bookings found</p>
                                        <p className="text-sm mt-1 max-w-xs mx-auto">There are no recorded transactions for this stand yet.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                                <Button onClick={() => setShowBookingsModal(false)} variant="outline">Close</Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${analytics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<IndianRupee className="h-6 w-6" />}
                    trend="+12.5% vs last week"
                />
                <StatCard
                    title="Active Parking"
                    value={analytics.activeParking.toString()}
                    icon={<CheckCircle className="h-6 w-6" />}
                    trend="+5% current capacity"
                />
                <StatCard
                    title="Today's Traffic"
                    value={analytics.todaysTraffic.toString()}
                    icon={<Activity className="h-6 w-6" />}
                    trend="Peak at 09:00 AM"
                />
                <StatCard
                    title="Alerts"
                    value="0"
                    icon={<AlertTriangle className="h-6 w-6" />}
                />
            </div>

            {/* Monitor Stands Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                            Live Network Monitor
                        </h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center"><MapIcon className="h-3 w-3 mr-1" /> Map</div>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center"><List className="h-3 w-3 mr-1" /> List</div>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        {/* Search Input for Map */}
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={monitorSearchQuery}
                                onChange={(e) => setMonitorSearchQuery(e.target.value)}
                                placeholder="Search stand name..."
                                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                            />
                            {monitorSearchQuery && (
                                <button
                                    onClick={() => setMonitorSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <Button size="sm" onClick={handleOpenAddModal}>
                            <Plus className="h-4 w-4 mr-2" /> Add Stand
                        </Button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedStandIds.length > 0 && viewMode === 'list' && (
                    <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2">
                        <span className="text-sm font-bold text-indigo-900 flex items-center">
                            <CheckSquare className="h-4 w-4 mr-2 text-indigo-600" />
                            {selectedStandIds.length} Selected
                        </span>
                        <div className="flex space-x-3">
                            <Button size="sm" variant="outline" className="bg-white text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleBulkStatusUpdate('active')}>
                                Set Active
                            </Button>
                            <Button size="sm" variant="outline" className="bg-white text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleBulkStatusUpdate('maintenance')}>
                                Set Maintenance
                            </Button>
                            <Button size="sm" variant="outline" className="bg-white text-red-600 border-red-200 hover:bg-red-50" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </div>
                    </div>
                )}

                {viewMode === 'map' ? (
                    <div className="relative w-full h-[500px] bg-gray-100">
                        <div ref={mapRef} className="w-full h-full" />
                        {!monitorSearchQuery && (
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow text-xs text-gray-600 z-10">
                                Showing all {stands.length} active stands
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 w-10">
                                        <button onClick={handleSelectAll} className="flex items-center text-gray-400 hover:text-indigo-600">
                                            {selectedStandIds.length === filteredStands.length && filteredStands.length > 0 ? (
                                                <CheckSquare className="h-5 w-5 text-indigo-600" />
                                            ) : (
                                                <Square className="h-5 w-5" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">Stand Name</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Capacity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStands.length > 0 ? (
                                    filteredStands.map((stand) => (
                                        <tr key={stand.id} className={`hover:bg-gray-50 transition-colors ${selectedStandIds.includes(stand.id) ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleSelectStand(stand.id)} className="flex items-center text-gray-400 hover:text-indigo-600">
                                                    {selectedStandIds.includes(stand.id) ? (
                                                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{stand.name}</td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={stand.address}>{stand.address || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                        <div
                                                            className={`h-1.5 rounded-full ${stand.availableSpots === 0 ? 'bg-red-500' : 'bg-green-500'}`}
                                                            style={{ width: `${(stand.availableSpots / stand.capacity) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs">{stand.availableSpots}/{stand.capacity}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stand.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {stand.status === 'active' ? 'Active' : 'Maintenance'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewBookings(stand)}
                                                        className="text-indigo-600 hover:text-indigo-900 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-xs font-medium flex items-center"
                                                        title="View Bookings"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 mr-1" /> Bookings
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditStandClick(stand)}
                                                        className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStand(stand.id)}
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No stands found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview (Last 7 Days)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => [`₹${value}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Live Occupancy</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={utilizationChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {utilizationChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div >
    );
};
