const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stand',
        required: true
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'cycle'],
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    amount: {
        type: Number
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);
