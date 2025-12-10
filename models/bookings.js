const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    ticketId: {
        type: String,
        unique: true
    },
    userName: String,
    stand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stand',
        required: true
    },
    standName: String, // Cached for easier display
    vehicleType: {
        type: String,
        enum: ['two-wheeler', 'car'],
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    vehicleModel: String,
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    totalAmount: Number,
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    standOwnerId: {
        type: String,
        required: true // Ensures the correct admin sees this booking
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
