const Booking = require('../models/bookings');
const Stand = require('../models/Stand');
const fs = require('fs');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        fs.appendFileSync('controller.log', `createBooking called with body: ${JSON.stringify(req.body)}\n`);
        console.log('createBooking req.body:', req.body);
        // Generate 10-digit Ticket ID: SS-DDMM-QQQQ
        // 1. Stand Identifier (2 digits from last 2 chars of hex ID)
        const standId = req.body.stand;
        if (!standId) {
            throw new Error('Stand ID is required');
        }
        const standIdentifier = parseInt(standId.slice(-2), 16) % 100;
        const standStr = String(standIdentifier).padStart(2, '0');

        // 2. Date (DDMM)
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const dateStr = `${day}${month}`;

        // 3. Queue Number (4 digits) - Count bookings for this stand today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const count = await Booking.countDocuments({
            stand: standId,
            startTime: { $gte: startOfDay }
        });
        const queueStr = String(count + 1).padStart(4, '0');

        const ticketId = `${standStr}${dateStr}${queueStr}`;
        fs.appendFileSync('controller.log', `Generated Ticket ID: ${ticketId}\n`);
        console.log('Generated Ticket ID:', ticketId);

        const booking = await Booking.create({ ...req.body, ticketId });

        // Decrement available spots
        if (booking.stand) {
            await Stand.findByIdAndUpdate(booking.stand, { $inc: { availableSpots: -1 } });
        }

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        fs.appendFileSync('controller.log', `createBooking error: ${error.message}\n${error.stack}\n`);
        console.error('createBooking error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: error.message || 'Server Error' });
        }
    }
};

// @desc    Get bookings by user ID
// @route   GET /api/bookings/user/:userId
// @access  Private
const getUserBookings = async (req, res) => {
    try {
        console.log(`Fetching bookings for user: ${req.params.userId}`);
        const bookings = await Booking.find({ userId: req.params.userId }).populate('stand');
        console.log(`Found ${bookings.length} bookings for user ${req.params.userId}`);
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get bookings for a specific stand (for Admin)
// @route   GET /api/bookings/stand/:standId
// @access  Private (Admin)
const getStandBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ stand: req.params.standId });
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update booking (e.g., complete or cancel)
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // If status is changing to completed or cancelled, increment available spots
        if (req.body.status && (req.body.status === 'completed' || req.body.status === 'cancelled') && booking.status === 'active') {
            if (booking.stand) {
                await Stand.findByIdAndUpdate(booking.stand, { $inc: { availableSpots: 1 } });
            }
            // Auto-mark as Paid if completed
            if (req.body.status === 'completed') {
                req.body.paymentStatus = 'Paid';
            }
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('stand');

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get booking by Ticket ID (for Scanner)
// @route   GET /api/bookings/ticket/:ticketId
// @access  Private
const getBookingByTicketId = async (req, res) => {
    try {
        const booking = await Booking.findOne({ ticketId: req.params.ticketId }).populate('stand');

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    createBooking,
    getUserBookings,
    getStandBookings,
    updateBooking,
    getBookingById,
    getBookingByTicketId
};
