const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/db');
const User = require('./models/User');
const { getTicketById, createTicket } = require('./controllers/ticketController');
const { createStand, getAllStands, getStandById, updateStand, deleteStand } = require('./controllers/standController');
const { createBooking, getUserBookings, getStandBookings, updateBooking, getBookingById, getBookingByTicketId } = require('./controllers/bookingController');
const { updateUser, getUser } = require('./controllers/userController');
const { register, login } = require('./controllers/authController');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// Request Logger
app.use((req, res, next) => {
  const log = `${new Date().toISOString()} ${req.method} ${req.url}\n`;
  try {
    fs.appendFileSync('server.log', log);
  } catch (e) {
    console.error("Failed to write to log file", e);
  }
  console.log(log.trim());
  next();
});

const PORT = process.env.BACKEND_PORT || 3002; // Backend will run on a different port

// --- Connect to MongoDB ---
connectDB();

// --- Routes ---

// Ticket Routes
app.get('/api/tickets/:id', getTicketById);
app.post('/api/tickets', createTicket);

// Stand Routes
app.post('/api/stands', createStand);
app.get('/api/stands', getAllStands);
app.get('/api/stands/:id', getStandById);
app.put('/api/stands/:id', updateStand);
app.delete('/api/stands/:id', deleteStand);

// Booking Routes
app.post('/api/bookings', createBooking);
app.get('/api/bookings/user/:userId', getUserBookings);
app.get('/api/bookings/stand/:standId', getStandBookings);
app.get('/api/bookings/:id', getBookingById);
app.put('/api/bookings/:id', updateBooking);
app.get('/api/bookings/ticket/:ticketId', getBookingByTicketId);

// User Routes
app.put('/api/users/:id', updateUser);
app.get('/api/users/:id', getUser);

// Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.post('/api/auth/google', async (req, res) => {
  const { token, role } = req.body; // The access token sent from frontend

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error: Missing environment variables.' });
  }

  try {
    // 1. Verify the Token with Google and get User Info
    // Using global fetch (Node 18+)
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const payload = await response.json();

    // 2. Extract User Info
    const { email, name, picture, sub: googleId } = payload;

    // 3. Database Logic
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        authProvider: 'google',
        role: role || 'user', // Use requested role or default
        avatar: picture,
        googleId
      });
    } else {
      // Update existing user's role if a specific role is requested
      if (role && user.role !== role) {
        user.role = role;
        await user.save();
      }
    }

    // 4. Generate Session JWT (Badge)
    const sessionToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 5. Send Badge and user info
    res.status(200).json({ user, token: sessionToken });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});