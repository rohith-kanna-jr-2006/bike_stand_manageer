const Ticket = require('../models/Ticket');

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private (or Public depending on requirements)
const getTicketById = async (req, res) => {
    try {
        const ticketId = req.params.id;

        // FIND ticket by ID
        // POPULATE 'user' to get the name and email
        // POPULATE 'stand' to get the stand name and address
        const ticket = await Ticket.findById(ticketId)
            .populate('user', 'name email')
            .populate('stand', 'name address');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const createTicket = async (req, res) => {
    try {
        const { userId, standId, vehicleType, vehicleNumber } = req.body;

        const ticket = await Ticket.create({
            user: userId,
            stand: standId,
            vehicleType,
            vehicleNumber
        });

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

module.exports = {
    getTicketById,
    createTicket
};
