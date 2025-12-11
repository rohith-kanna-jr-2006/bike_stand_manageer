const dotenv = require('dotenv');
dotenv.config();

console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
    console.log("JWT_SECRET length:", process.env.JWT_SECRET.length);
}
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
