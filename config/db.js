const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable or fallback to local string
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_cycle_db';

        const conn = await mongoose.connect(uri);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
