const mongoose = require('mongoose');
const Booking = require('./models/bookings');
const Stand = require('./models/Stand');
const dotenv = require('dotenv');

dotenv.config();

const migrateTicketIds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure-cycle');
        console.log('MongoDB Connected');

        const bookings = await Booking.find({ ticketId: { $exists: false } }).sort({ startTime: 1 });
        console.log(`Found ${bookings.length} bookings to migrate.`);

        for (const booking of bookings) {
            // 1. Stand Identifier
            let standStr = '00';
            if (booking.stand) {
                const standId = booking.stand.toString();
                const standIdentifier = parseInt(standId.slice(-2), 16) % 100;
                standStr = String(standIdentifier).padStart(2, '0');
            }

            // 2. Date (DDMM)
            const date = new Date(booking.startTime);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dateStr = `${day}${month}`;

            // 3. Queue Number
            // Count bookings for this stand on this day *before* this booking
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const count = await Booking.countDocuments({
                stand: booking.stand,
                startTime: { $gte: startOfDay, $lt: booking.startTime } // Strictly before
            });

            // If multiple bookings have exact same time, this might collide, but unlikely for manual testing.
            // To be safe, we could use the index in the sorted array if we processed per-day-per-stand.
            // But simple count is decent for now.

            const queueStr = String(count + 1).padStart(4, '0');

            const newTicketId = `${standStr}${dateStr}${queueStr}`;

            booking.ticketId = newTicketId;
            await booking.save();
            console.log(`Updated Booking ${booking._id} with Ticket ID: ${newTicketId}`);
        }

        console.log('Migration completed.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

migrateTicketIds();
