import React, { useContext, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConfigContext } from '../contexts/ConfigContext';
import { QrCode, Clock, MapPin, History, Ticket, Map, FileText, ChevronRight, Navigation, Zap, X, CheckCircle, Loader2, Trash2, Eye, IndianRupee, Bike, Car } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BookingSuccess } from '../components/BookingSuccess';
import { TicketView } from '../components/TicketView';

export const UserDashboard = ({ onNavigate }) => {
    const { user } = useAuth();
    const config = useContext(ConfigContext);
    const baseRate = config?.baseRate || 50.00;

    // State for features
    const [showStands, setShowStands] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Data State
    const [stands, setStands] = useState([]);
    const [loadingStands, setLoadingStands] = useState(true);

    // Ticket Generation State
    const [showTicketModal, setShowTicketModal] = useState(false); // Controls the initial input modal
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Controls Success Screen
    const [showTicketView, setShowTicketView] = useState(false); // Controls Detailed Ticket View
    const [isGenerating, setIsGenerating] = useState(false);

    const [generatedTicket, setGeneratedTicket] = useState(null);
    const [selectedBikeType, setSelectedBikeType] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('Cash');


    // Booking State
    const [selectedStand, setSelectedStand] = useState(null);

    // Vehicle Details State
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');

    // Stores the full ticket object for the view
    const [activeTicketDetails, setActiveTicketDetails] = useState(null);

    // History State
    const [historyItems, setHistoryItems] = useState([]);



    // --- API: Fetch Stands ---
    useEffect(() => {
        const fetchStands = async () => {
            try {
                const response = await fetch('http://10.38.187.211:3002/api/stands');
                const data = await response.json();
                if (data.success) {
                    // Filter for active stands and map _id to id
                    const activeStands = data.data
                        .filter((stand) => stand.status === 'active')
                        .map((stand) => ({
                            ...stand,
                            id: stand._id,
                            // Map GeoJSON location to lat/lng if needed, or keep as is if unused
                            location: stand.location?.coordinates ? {
                                lat: stand.location.coordinates[1],
                                lng: stand.location.coordinates[0]
                            } : stand.location
                        }));
                    setStands(activeStands);
                }
                setLoadingStands(false);
            } catch (error) {
                console.error("Error fetching stands:", error);
                setLoadingStands(false);
            }
        };

        fetchStands();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchStands, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        if (!user) return;

        // 1. Restore Active Ticket (We trust localStorage for UI state, but ID refers to Firestore doc)
        const userId = user.id || user._id;
        const storedTicketJson = localStorage.getItem(`active_ticket_${userId}`);
        if (storedTicketJson) {
            try {
                const ticket = JSON.parse(storedTicketJson);
                // Ensure status is active for the local storage restore
                ticket.status = 'active';
                setActiveTicketDetails(ticket);
                setGeneratedTicket(ticket.ticketId);

                // Restore form defaults
                setSelectedBikeType(ticket.vehicleType === 'car' ? 'car' : (ticket.vehicleType === 'electric' ? 'electric' : 'standard'));
                setVehicleNumber(ticket.vehicleNumber);
                setVehicleModel(ticket.vehicleModel || '');
            } catch (e) {
                console.error("Failed to parse stored ticket", e);
                localStorage.removeItem(`active_ticket_${user.id}`);
            }
        } else {
            setActiveTicketDetails(null);
            setGeneratedTicket(null);

            // Pre-fill from User Profile (Settings)
            if (user.vehicleNumber) setVehicleNumber(user.vehicleNumber);
            if (user.vehicleModel) setVehicleModel(user.vehicleModel);
            if (user.vehicleType) {
                setSelectedBikeType(user.vehicleType === 'car' ? 'car' : 'standard');
            }
        }

        // 2. Fetch History from API (Unique to this User ID)
        const fetchHistory = async () => {
            try {
                const userId = user.id || user._id;
                console.log("Fetching history for userId:", userId);
                const response = await fetch(`http://10.38.187.211:3002/api/bookings/user/${userId}`);
                const data = await response.json();
                console.log("History API response:", data);

                if (data.success) {
                    const historyData = data.data
                        .filter((booking) => {
                            const isHistory = booking.status === 'completed' || booking.status === 'cancelled';
                            if (!isHistory) console.log("Skipping active booking:", booking._id);
                            return isHistory;
                        })
                        .map((booking) => {
                            const date = new Date(booking.startTime).toLocaleDateString();
                            return {
                                id: booking._id,
                                date: date,
                                location: booking.standName || 'Unknown Stand',
                                duration: booking.status === 'completed' ? 'Completed' : 'Cancelled',
                                cost: `₹${booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'}`,
                                status: booking.status === 'completed' ? 'Paid' : 'Cancelled',
                                paymentMethod: booking.paymentMethod || '-',
                                raw: { ...booking, id: booking._id, standId: booking.stand || booking.standId }
                            };
                        })
                        .sort((a, b) => new Date(b.raw.startTime).getTime() - new Date(a.raw.startTime).getTime());

                    setHistoryItems(historyData);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };

        fetchHistory();


    }, [user]);

    const saveActiveTicketLocal = (ticket) => {
        if (!user) return;
        const userId = user.id || user._id;
        localStorage.setItem(`active_ticket_${userId}`, JSON.stringify(ticket));
    };

    const clearActiveTicketLocal = () => {
        if (!user) return;
        const userId = user.id || user._id;
        localStorage.removeItem(`active_ticket_${userId}`);
        setActiveTicketDetails(null);
        setGeneratedTicket(null);
    };

    // --- HANDLERS ---

    const handleBookStand = (stand) => {
        if (stand.availableSpots <= 0) {
            alert("Sorry, this stand is currently full.");
            return;
        }
        setSelectedStand(stand);
        setShowTicketModal(true);
    };

    const handleStartBooking = () => {
        if (generatedTicket) {
            setShowTicketView(true);
        } else {
            // Enforce flow: Show stands first
            setShowStands(true);
            // Scroll to the stands section for better UX
            setTimeout(() => {
                const section = document.getElementById('stands-section');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleGenerateTicket = async () => {
        if (!vehicleNumber.trim() || !user || !selectedStand) return;

        setIsGenerating(true);

        const isOnline = paymentMethod === 'UPI'; // Assuming 'UPI' triggers the online flow

        // Initial Booking Payload
        // Note: We set paymentStatus to 'Pending' initially for all. 
        // If Cash, it stays Pending. If Online, we update it upon success.
        const bookingPayload = {
            userId: user.id || user._id,
            userName: user.name,
            stand: selectedStand.id,
            standName: selectedStand.name,
            standOwnerId: selectedStand.ownerId,
            vehicleType: selectedBikeType === 'standard' ? 'two-wheeler' : (selectedBikeType === 'car' ? 'car' : 'two-wheeler'),
            vehicleNumber: vehicleNumber,
            vehicleModel: vehicleModel,
            status: 'active',
            totalAmount: selectedStand?.rates?.[selectedBikeType === 'car' ? 'car' : 'bike'] || 10, // Default amount for payment
            paymentMethod: paymentMethod,
            paymentStatus: 'Pending'
        };

        try {
            // 1. Create Booking (Pending State)
            const response = await fetch('http://10.38.187.211:3002/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload),
            });

            const data = await response.json();

            if (data.success) {
                const newTicketId = data.data.ticketId;
                const mongoId = data.data._id;
                const bookingAmount = bookingPayload.totalAmount; // Use the amount we sent

                const newTicketLocal = {
                    id: mongoId,
                    ticketId: newTicketId,
                    userName: user.name,
                    bookedDate: new Date().toISOString(),
                    standName: selectedStand.name,
                    vehicleType: selectedBikeType,
                    vehicleNumber: vehicleNumber,
                    vehicleModel: vehicleModel,
                    standId: selectedStand.id,
                    status: 'active',
                    paymentMethod: paymentMethod,
                    paymentStatus: 'Pending',
                    amount: bookingAmount
                };

                // Helper to Finish Flow
                const finishSuccess = (status = 'Pending') => {
                    newTicketLocal.paymentStatus = status;

                    setGeneratedTicket(newTicketId);
                    setActiveTicketDetails(newTicketLocal);
                    saveActiveTicketLocal(newTicketLocal);

                    setIsGenerating(false);
                    setShowTicketModal(false);
                    setShowSuccessModal(true);
                };

                if (isOnline) {
                    // 2. Initiate Razorpay Payment
                    try {
                        const orderRes = await fetch('http://10.38.187.211:3002/api/payment/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                amount: bookingAmount,
                                bookingId: mongoId
                            })
                        });
                        const orderData = await orderRes.json();

                        if (orderData.success) {
                            const options = {
                                key: orderData.key_id,
                                amount: orderData.data.amount,
                                currency: orderData.data.currency,
                                name: "SecurePark",
                                description: `Parking at ${selectedStand.name}`,
                                order_id: orderData.data.id,
                                handler: async function (response) {
                                    // 3. Verify Payment
                                    try {
                                        const verifyRes = await fetch('http://10.38.187.211:3002/api/payment/verify-payment', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                razorpay_order_id: response.razorpay_order_id,
                                                razorpay_payment_id: response.razorpay_payment_id,
                                                razorpay_signature: response.razorpay_signature,
                                                bookingId: mongoId
                                            })
                                        });
                                        const verifyData = await verifyRes.json();

                                        if (verifyData.success) {
                                            finishSuccess('Paid');
                                        } else {
                                            alert("Payment Verification Failed. Ticket Generated but Unpaid.");
                                            finishSuccess('Pending');
                                        }
                                    } catch (vErr) {
                                        console.error("Verification Error:", vErr);
                                        finishSuccess('Pending');
                                    }
                                },
                                prefill: {
                                    name: user.name,
                                    email: user.email || 'user@example.com',
                                    contact: user.phone || '9999999999'
                                },
                                theme: {
                                    color: "#4f46e5"
                                },
                                modal: {
                                    ondismiss: function () {
                                        setIsGenerating(false);
                                        // User closed modal, ticket is still pending
                                        finishSuccess('Pending');
                                    }
                                }
                            };

                            const rzp = new window.Razorpay(options);
                            rzp.on('payment.failed', function (response) {
                                alert(`Payment Failed: ${response.error.description}`);
                                setIsGenerating(false);
                                finishSuccess('Pending');
                            });
                            rzp.open();

                        } else {
                            throw new Error("Failed to initiate payment order");
                        }
                    } catch (payErr) {
                        console.error("Payment Order Error:", payErr);
                        alert("Could not start online payment. Ticket created as Pending.");
                        finishSuccess('Pending');
                    }
                } else {
                    // Cash Flow
                    finishSuccess('Pending');
                }

            } else {
                throw new Error(data.error || "Failed to create booking");
            }
        } catch (error) {
            console.error("Critical error creating booking:", error);
            setIsGenerating(false);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const handleShowTicketFromSuccess = () => {
        setShowSuccessModal(false);
        setShowTicketView(true);
    };

    const handleCloseTicketView = async () => {
        setShowTicketView(false);

        // If we were viewing a history item, restore the active ticket (if any)
        if (activeTicketDetails && (activeTicketDetails.status === 'completed' || activeTicketDetails.status === 'cancelled')) {
            // Check local storage to see if we have a *real* active ticket to show instead
            if (user) {
                const userId = user.id || user._id;
                const storedTicketJson = localStorage.getItem(`active_ticket_${userId}`);
                if (storedTicketJson) {
                    try {
                        const ticket = JSON.parse(storedTicketJson);

                        // Migration for old tickets: if id is missing, use ticketId as id
                        if (!ticket.id && ticket.ticketId) {
                            ticket.id = ticket.ticketId;
                        }

                        // Fetch fresh data from API to ensure we have the latest ticketId
                        if (ticket.id && !ticket.id.startsWith('OFFLINE')) {
                            try {
                                const response = await fetch(`http://10.38.187.211:3002/api/bookings/${ticket.id}`);
                                const data = await response.json();
                                if (data.success && data.data) {
                                    // Update local state with fresh data
                                    const freshTicket = {
                                        ...ticket,
                                        ticketId: data.data.ticketId || ticket.ticketId, // Use fresh ticketId
                                        status: data.data.status || ticket.status
                                    };
                                    setActiveTicketDetails(freshTicket);
                                    setGeneratedTicket(freshTicket.ticketId);
                                    // Update local storage
                                    localStorage.setItem(`active_ticket_${userId}`, JSON.stringify(freshTicket));
                                } else {
                                    // Fallback to stored data if API fails (e.g. network issue)
                                    setActiveTicketDetails(ticket);
                                    setGeneratedTicket(ticket.ticketId);
                                }
                            } catch (err) {
                                console.error("Error fetching fresh ticket details:", err);
                                setActiveTicketDetails(ticket);
                                setGeneratedTicket(ticket.ticketId);
                            }
                        } else {
                            setActiveTicketDetails(ticket);
                            setGeneratedTicket(ticket.ticketId);
                        }

                    } catch (e) {
                        console.error("Failed to parse stored ticket", e);
                        setActiveTicketDetails(null); // Clear if parsing fails
                        setGeneratedTicket(null);
                    }
                } else {
                    setActiveTicketDetails(null);
                }
            }
        }
    };

    const handleCancelTicket = async () => {
        if (window.confirm("Are you sure you want to cancel this ticket?")) {
            if (activeTicketDetails) {
                try {
                    // Update API if it's a real ticket
                    if (!activeTicketDetails.id.startsWith('OFFLINE')) {
                        await fetch(`http://10.38.187.211:3002/api/bookings/${activeTicketDetails.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                status: 'cancelled',
                                endTime: new Date()
                            }),
                        });
                    }
                } catch (error) {
                    console.error("Error cancelling booking:", error);
                }
            }
        }

        clearActiveTicketLocal();
        setVehicleNumber('');
        setVehicleModel('');
        setSelectedStand(null);
        setShowTicketView(false);
        setShowTicketModal(false);
    };

    // View Ticket from History
    const handleViewHistoryTicket = (item) => {
        const historyTicket = {
            id: item.raw.id,
            ticketId: item.raw.ticketId || item.raw.id, // Fallback for old bookings
            userName: item.raw.userName || user?.name || 'User',
            bookedDate: item.raw.startTime?.toDate ? item.raw.startTime.toDate().toISOString() : new Date(item.raw.startTime).toISOString(),
            standName: item.raw.standName || 'Unknown',
            vehicleType: item.raw.vehicleType || 'two-wheeler',
            vehicleNumber: item.raw.vehicleNumber || 'N/A',
            vehicleModel: item.raw.vehicleModel || '',
            standId: item.raw.standId || '',
            status: item.raw.status,
            amount: item.raw.totalAmount ? item.raw.totalAmount.toFixed(2) : '0.00'
        };

        setActiveTicketDetails(historyTicket);
        setShowTicketView(true);
    };



    return (
        <div className="space-y-8 relative">

            {/* 1. Booking Success Screen */}
            {showSuccessModal && (
                <BookingSuccess
                    onShowTicket={handleShowTicketFromSuccess}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}

            {/* 2. Detailed Ticket View (With Download) */}
            {showTicketView && activeTicketDetails && (
                <TicketView
                    ticket={activeTicketDetails}
                    onClose={handleCloseTicketView}
                />
            )}

            {/* 3. History Modal - NEW */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center">
                                <History className="h-5 w-5 mr-2 text-indigo-600" />
                                Parking History
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-900 font-semibold sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Total Cost</th>
                                        <th className="px-6 py-4">Payment Method</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historyItems.length > 0 ? historyItems.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{item.date}</div>
                                                <div className="text-xs text-gray-400">{new Date(item.raw.startTime?.toDate ? item.raw.startTime.toDate() : item.raw.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.location}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.status === 'Paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.cost}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500">{item.paymentMethod || '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewHistoryTicket(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-xs font-medium border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <History className="h-8 w-8 text-gray-300" />
                                                </div>
                                                <p>No parking history found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}



            {/* Ticket Generation Input Modal */}
            {showTicketModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <Ticket className="h-5 w-5 mr-2 text-indigo-600" />
                                {selectedStand ? 'Book Specific Stand' : 'New Ticket'}
                            </h3>
                            <button onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                <div className="text-center">
                                    {selectedStand ? (
                                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 animate-in zoom-in-95">
                                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Selected Location</p>
                                            <p className="text-gray-900 font-bold text-lg">{selectedStand.name}</p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {selectedStand.address || 'Location Coordinates'}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Vehicle Type Selection */}
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setSelectedBikeType('standard')}
                                        className={`p-3 rounded-xl border-2 transition-all text-center ${selectedBikeType === 'standard' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                                    >
                                        <div className="mx-auto w-8 h-8 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                            <Bike className="h-4 w-4" />
                                        </div>
                                        <div className="font-semibold text-xs">Bike</div>
                                        <div className="text-[10px] opacity-75 mt-1 font-bold">
                                            ₹{selectedStand?.rates?.bike || 10}/hr
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setSelectedBikeType('electric')}
                                        className={`p-3 rounded-xl border-2 transition-all text-center ${selectedBikeType === 'electric' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                                    >
                                        <div className="mx-auto w-8 h-8 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                            <Zap className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <div className="font-semibold text-xs">E-Bike</div>
                                        <div className="text-[10px] opacity-75 mt-1 font-bold">
                                            ₹{(selectedStand?.rates?.bike || 10) + 5}/hr
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setSelectedBikeType('car')}
                                        className={`p-3 rounded-xl border-2 transition-all text-center ${selectedBikeType === 'car' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                                    >
                                        <div className="mx-auto w-8 h-8 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                            <Car className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="font-semibold text-xs">Car</div>
                                        <div className="text-[10px] opacity-75 mt-1 font-bold">
                                            ₹{selectedStand?.rates?.car || 50}/hr
                                        </div>
                                    </button>
                                </div>

                                {/* Quick Select Saved Vehicles */}
                                {user?.savedVehicles && user.savedVehicles[{ 'standard': 'bike', 'electric': 'ebike', 'car': 'car' }[selectedBikeType] || 'bike']?.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Saved Vehicles</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.savedVehicles[{ 'standard': 'bike', 'electric': 'ebike', 'car': 'car' }[selectedBikeType] || 'bike'].map((v, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setVehicleNumber(v.number);
                                                        setVehicleModel(v.model || '');
                                                    }}
                                                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors flex items-center"
                                                >
                                                    {v.number}
                                                    {v.model && <span className="opacity-50 ml-1">({v.model})</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Vehicle Details Inputs */}
                                <div className="space-y-3">
                                    <Input
                                        label="Bike / Vehicle Number"
                                        placeholder="e.g. AB-12-CD-3456"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                    />
                                    <Input
                                        label="Model / Color (Optional)"
                                        placeholder="e.g. Black Pulsar"
                                        value={vehicleModel}
                                        onChange={(e) => setVehicleModel(e.target.value)}
                                    />
                                </div>

                                {/* Payment Method Selection */}
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Payment Method</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPaymentMethod('Cash')}
                                            className={`p-3 rounded-lg border text-center transition-all ${paymentMethod === 'Cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            <div className="font-semibold text-xs mb-1">Cash (Pay Later)</div>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('UPI')}
                                            className={`p-3 rounded-lg border text-center transition-all ${paymentMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            <div className="font-semibold text-xs mb-1">Pay Online (UPI)</div>
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerateTicket}
                                    isLoading={isGenerating}
                                    disabled={!vehicleNumber.trim() || !selectedStand}
                                    className="w-full py-3 text-lg"
                                >
                                    {isGenerating ? 'Booking...' : `Confirm Booking`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div >
            )}

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <QrCode size={200} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-indigo-100 mt-2 max-w-lg text-lg">
                        Ready to park? Find a spot or check your active sessions.
                    </p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Get/Show Ticket Action */}
                <button
                    onClick={handleStartBooking}
                    className={`p-6 rounded-xl shadow-sm border hover:shadow-md transition-all group text-left relative overflow-hidden ${generatedTicket ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-300' : 'bg-white border-gray-100 hover:border-indigo-200'}`}
                >
                    {generatedTicket ? (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    ) : (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    )}

                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${generatedTicket ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                            {generatedTicket ? <QrCode className="h-6 w-6" /> : <Ticket className="h-6 w-6" />}
                        </div>
                        <h3 className={`text-lg font-bold transition-colors ${generatedTicket ? 'text-indigo-900' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                            {generatedTicket ? 'Show Entry Pass' : 'Book Parking'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">
                            {generatedTicket ? 'View your active entry QR code.' : 'Select a stand to generate an entry ticket.'}
                        </p>
                        <span className="text-sm font-medium text-indigo-600 flex items-center">
                            {generatedTicket ? (
                                <>View QR <Eye className="h-4 w-4 ml-1" /></>
                            ) : (
                                <>Select Stand <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </span>
                    </div>
                </button>



                {/* Find Stands Action */}
                <button
                    onClick={() => setShowStands(!showStands)}
                    className={`bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all group text-left relative overflow-hidden ${showStands ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-100 hover:border-emerald-200'}`}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                            <Map className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Find Stands</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">Locate available parking spots near you.</p>
                        <span className="text-sm font-medium text-emerald-600 flex items-center">
                            {showStands ? 'Hide Map' : 'Show Map'} <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showStands ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                        </span>
                    </div>
                </button>

                {/* Statements / History Action */}
                <button
                    onClick={() => setShowHistory(true)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                            <FileText className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Ticket History</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">View past trips, billing, and download receipts.</p>
                        <span className="text-sm font-medium text-blue-600 flex items-center">
                            View History <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                </button>
            </div>

            {/* Real Stands View (Fetched from Firestore) */}
            {
                showStands && (
                    <div id="stands-section" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col md:flex-row h-96">
                        {/* List View */}
                        <div className="w-full md:w-1/3 border-r border-gray-100 overflow-y-auto">
                            <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50/30 sticky top-0 backdrop-blur-sm">
                                <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wide">
                                    <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                                    Available Locations (Real-Time)
                                </h3>
                            </div>

                            {loadingStands ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading stands...
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {stands.length > 0 ? stands.map((stand) => (
                                        <div
                                            key={stand.id}
                                            onClick={() => handleBookStand(stand)}
                                            className="p-4 hover:bg-emerald-50/30 cursor-pointer transition-colors group relative"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{stand.name}</p>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                                        <Navigation className="h-3 w-3 mr-1" />
                                                        <span className="truncate max-w-[150px]">{stand.address || 'View on map'}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stand.availableSpots > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {stand.availableSpots} Spots
                                                </span>
                                            </div>

                                            <div className="absolute inset-0 bg-indigo-50/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="font-bold text-indigo-700 flex items-center text-sm">
                                                    <Ticket className="w-4 h-4 mr-1" /> Book This Stand
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-6 text-center text-gray-500 text-sm">
                                            No active stands found. <br /> Ask an admin to add one.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Static Map View for Demo (Coordinates from real stands) */}
                        <div className="w-full md:w-2/3 bg-gray-100 relative overflow-hidden group flex items-center justify-center">
                            {/* Map Grid Pattern */}
                            <div className="absolute inset-0 opacity-10"
                                style={{ backgroundImage: 'radial-gradient(#6b7280 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                            </div>

                            {stands.length > 0 ? (
                                <div className="text-center">
                                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Map visualization of {stands.length} stands</p>
                                    <p className="text-xs text-gray-400">(Select a stand from the list to book)</p>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No map data available</p>
                            )}

                            <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow text-xs font-semibold text-gray-500">
                                Live Data
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Ticket Card - Only visible if ticket generated */}
                {generatedTicket && (
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <QrCode className="h-5 w-5 mr-2 text-indigo-600" />
                                Active Ticket
                            </h3>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full animate-pulse">Ready to Scan</span>
                        </div>

                        <div className="p-6 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                            <div className="bg-white p-2 border-2 border-gray-900 rounded-lg shadow-sm">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${generatedTicket}`} alt="Ticket QR" className="w-32 h-32" />
                                <p className="text-xs text-center mt-2 font-mono text-gray-500">#{generatedTicket.slice(-6)}</p>
                            </div>

                            <div className="flex-1 space-y-5 w-full">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</p>
                                        <div className="flex items-center mt-1 text-gray-900 font-medium">
                                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                            {activeTicketDetails?.standName}
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Vehicle</p>
                                        <div className="flex items-center mt-1 text-gray-900 font-medium">
                                            {activeTicketDetails?.vehicleType === 'car' ? (
                                                <Car className="h-4 w-4 mr-1 text-gray-400" />
                                            ) : (
                                                <Bike className="h-4 w-4 mr-1 text-gray-400" />
                                            )}
                                            {activeTicketDetails?.vehicleNumber}
                                            {activeTicketDetails?.vehicleModel && <span className="text-gray-400 font-normal ml-2">({activeTicketDetails.vehicleModel})</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Generated At</p>
                                        <div className="flex items-center mt-1 text-gray-900">
                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                            {new Date(activeTicketDetails?.bookedDate || Date.now()).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status & Payment</p>
                                    <div className="flex items-center mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${activeTicketDetails?.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} capitalize`}>
                                            {activeTicketDetails?.paymentStatus || 'Pending'} ({activeTicketDetails?.paymentMethod || 'Cash'})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex space-x-3">
                                <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50 border-gray-200" onClick={handleCancelTicket}>
                                    Cancel Ticket
                                </Button>
                                <Button className="flex-1" onClick={() => setShowTicketView(true)}>
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </div>

                )}

                {/* Profile / Quick Info - Span full width if no ticket */}
                <div className={`space-y-6 ${!generatedTicket ? 'lg:col-span-3' : ''}`}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`} alt="Profile" className="w-16 h-16 rounded-full border-4 border-indigo-50 shadow-sm" />
                            <div>
                                <h3 className="font-bold text-gray-900">{user?.name}</h3>
                                <p className="text-sm text-gray-500 capitalize">{user?.role} Account</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-sm"
                                onClick={() => onNavigate('settings')}
                            >
                                Edit Profile & Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
