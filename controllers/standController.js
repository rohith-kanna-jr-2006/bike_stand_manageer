const Stand = require('../models/Stand');

// @desc    Create a new stand
// @route   POST /api/stands
// @access  Private (Admin)
const createStand = async (req, res) => {
    try {
        console.log("Creating stand with data:", JSON.stringify(req.body, null, 2));
        const stand = await Stand.create(req.body);
        res.status(201).json({
            success: true,
            data: stand
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }
};

// @desc    Get all stands (optionally filter by ownerId)
// @route   GET /api/stands
// @access  Public
const getAllStands = async (req, res) => {
    try {
        let query = {};

        // Check if ownerId query param exists
        if (req.query.ownerId) {
            query.ownerId = req.query.ownerId;
        }

        const stands = await Stand.find(query);
        res.status(200).json({
            success: true,
            count: stands.length,
            data: stands
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single stand
// @route   GET /api/stands/:id
// @access  Public
const getStandById = async (req, res) => {
    try {
        const stand = await Stand.findById(req.params.id);

        if (!stand) {
            return res.status(404).json({ success: false, error: 'Stand not found' });
        }

        res.status(200).json({
            success: true,
            data: stand
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update stand
// @route   PUT /api/stands/:id
// @access  Private (Admin)
const updateStand = async (req, res) => {
    try {
        let stand = await Stand.findById(req.params.id);

        if (!stand) {
            return res.status(404).json({ success: false, error: 'Stand not found' });
        }

        // Update stand
        stand = await Stand.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: stand
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete stand
// @route   DELETE /api/stands/:id
// @access  Private (Admin)
const deleteStand = async (req, res) => {
    try {
        const stand = await Stand.findById(req.params.id);

        if (!stand) {
            return res.status(404).json({ success: false, error: 'Stand not found' });
        }

        await stand.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    createStand,
    getAllStands,
    getStandById,
    updateStand,
    deleteStand
};
