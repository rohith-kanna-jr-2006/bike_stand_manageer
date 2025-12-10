import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, MapPin, Calendar, User, Bike, Car, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const TicketView = ({ ticket, onClose }) => {
    const ticketRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const status = ticket.status || 'active';
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';

    const handleDownloadTicket = async () => {
        if (!ticketRef.current) return;
        setIsDownloading(true);

        try {
            const originalElement = ticketRef.current;

            // CLONE STRATEGY: 
            // We clone the node to render it "flat" (without scrollbars) off-screen.
            // This ensures html2canvas captures the entire height even if scrolled.
            const clone = originalElement.cloneNode(true);

            // Style the clone for capture
            clone.style.position = 'fixed';
            clone.style.top = '0';
            clone.style.left = '-9999px'; // Move off-screen
            clone.style.width = '600px';  // Fixed width for consistent PDF layout
            clone.style.height = 'auto';  // Full height
            clone.style.zIndex = '-9999';
            clone.style.overflow = 'visible';
            clone.style.backgroundColor = '#ffffff';

            // Append to body so it renders
            document.body.appendChild(clone);

            // Slight delay to ensure DOM and SVGs render correctly in the clone
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(clone, {
                scale: 2, // High resolution
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true, // Important for images
                allowTaint: true,
                scrollY: 0,
                scrollX: 0
            });

            // Remove clone after capture
            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Calculate height to maintain aspect ratio
            // We add a margin (10mm) on sides
            const margin = 15;
            const availableWidth = pdfWidth - (margin * 2);
            const finalHeight = (imgProps.height * availableWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, finalHeight);
            pdf.save(`SecureCycle-Ticket-${ticket.ticketId}.pdf`);

        } catch (error) {
            console.error('Failed to download ticket', error);
            alert('Could not download ticket. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className={`p-4 border-b border-gray-100 flex justify-between items-center text-white ${isCompleted ? 'bg-green-600' : (isCancelled ? 'bg-red-600' : 'bg-indigo-600')}`}>
                    <h3 className="font-bold flex items-center">
                        {isCompleted ? 'Payment Receipt' : (isCancelled ? 'Cancelled Ticket' : 'SecureCycle Pass')}
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 bg-gray-50 flex-1">
                    {/* Ticket Card Area (To be captured) */}
                    <div ref={ticketRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
                        {/* Decorative Top */}
                        <div className={`h-3 bg-gradient-to-r ${isCompleted ? 'from-green-500 to-emerald-600' : (isCancelled ? 'from-red-500 to-red-600' : 'from-indigo-500 via-purple-500 to-indigo-500')}`}></div>

                        <div className="p-6 text-center">
                            <div className="mb-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Entry Pass</p>
                                <h2 className={`text-2xl font-black tracking-tight ${isCompleted ? 'text-green-600' : (isCancelled ? 'text-red-600' : 'text-gray-900')}`}>
                                    {isCompleted ? 'PAID & COMPLETED' : (isCancelled ? 'CANCELLED' : 'CONFIRMED')}
                                </h2>
                            </div>

                            {/* QR Code (Opacified if not active) */}
                            <div className={`my-6 flex justify-center ${!status || status === 'active' ? '' : 'opacity-25 grayscale'}`}>
                                <div className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                                    <QRCodeSVG
                                        value={ticket.ticketId}
                                        size={180}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                            </div>
                            <div className="mb-6">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Ticket ID</p>
                                <p className="font-mono text-lg font-bold text-gray-700 tracking-wider bg-gray-100 inline-block px-3 py-1 rounded-lg border border-gray-200">
                                    {ticket.ticketId || 'ID Pending'}
                                </p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-left bg-gray-50 p-4 rounded-xl border border-gray-100">

                                <div className="col-span-2 flex items-center pb-3 border-b border-gray-200">
                                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                        <User className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Account Name</p>
                                        <p className="font-bold text-gray-900 text-sm">{ticket.userName}</p>
                                    </div>
                                </div>

                                <div className="col-span-2 flex items-center pb-3 border-b border-gray-200">
                                    <div className="bg-emerald-100 p-2 rounded-full mr-3">
                                        <MapPin className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Stand Location</p>
                                        <p className="font-bold text-gray-900 text-sm">{ticket.standName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <div className="mr-3">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Booked Date</p>
                                        <p className="font-semibold text-gray-900 text-xs">{new Date(ticket.bookedDate).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(ticket.bookedDate).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <div className="mr-3">
                                        {ticket.vehicleType === 'car' ? <Car className="h-4 w-4 text-blue-500" /> : <Bike className="h-4 w-4 text-indigo-500" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{ticket.vehicleType.toUpperCase()}</p>
                                        <p className="font-semibold text-gray-900 text-xs">{ticket.vehicleNumber}</p>
                                    </div>
                                </div>

                                {isCompleted && ticket.amount && (
                                    <div className="col-span-2 pt-3 mt-1 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Total Paid</span>
                                        <span className="text-lg font-bold text-green-600">₹{ticket.amount}</span>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Watermark / Footer of Ticket */}
                        <div className="bg-gray-100 px-6 py-3 text-center border-t border-gray-200">
                            <p className="text-[10px] text-gray-500">
                                {isCompleted ? 'Thank you for using SecureCycle.' : 'Scan this code at the entry gate.'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">SECURE-CYCLE-SYSTEM</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-100 bg-white flex space-x-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={handleDownloadTicket} disabled={isDownloading} className="flex-1 flex items-center justify-center">
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" /> Download {isCompleted ? 'Receipt' : 'Ticket'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
