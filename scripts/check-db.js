const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_cycle_db');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Check Collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n--- Collections ---');
        collections.forEach(c => console.log(`- ${c.name}`));

        // Count Documents
        console.log('\n--- Counts ---');

        // We can dynamically count if we want, or just check specific ones
        const users = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`Users: ${users}`);

        const stands = await mongoose.connection.db.collection('stands').countDocuments();
        console.log(`Stands: ${stands}`);

        const bookings = await mongoose.connection.db.collection('bookings').countDocuments();
        console.log(`Bookings: ${bookings}`);

        console.log('\n-------------------');
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
