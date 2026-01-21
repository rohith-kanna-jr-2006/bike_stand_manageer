const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/bookings');
const Stand = require('../models/Stand');

// Initialize Razorpay
// Note: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in your .env file
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE', // Fallback for dev if not set
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE'
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, bookingId } = req.body;

        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: {
                bookingId: bookingId
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            data: order,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay createOrder error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Payment initiation failed'
        });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment Success! Update the booking
            if (bookingId) {
                const booking = await Booking.findById(bookingId);
                if (booking) {
                    booking.status = 'active'; // Ensure it's active
                    booking.paymentStatus = 'Paid';
                    booking.paymentMethod = 'Online'; // Or 'Razorpay'
                    booking.transactionId = razorpay_payment_id;
                    await booking.save();

                    // If the booking was previously 'pending' or not influencing spots, handle it here.
                    // Assuming spot is deducted on creation, so we just confirm payment.
                    // If your logic deducts spots ONLY after payment, you'd do it here.
                    // Current logic in bookingController deducts spots immediately on creation.
                }
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('Razorpay verifyPayment error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Payment verification failed'
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment
};
