require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Load cron job
require('./cron/emailReminderCron');

// Import Routes
const subscribeRoute = require('./routes/subscribe');
const getVapidPublicKeyRoute = require('./routes/getVapidPublicKey');
const authRoutes = require('./routes/auth');
const reminderRoutes = require('./routes/reminders'); // Import reminder routes
const pushRoutes = require('./routes/pushRoutes');

// Initialize express app
const app = express();

// Allow the vercel frontend
const allowedOrigins = ['https://medicine-frontend2.vercel.app'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // only if you're using cookies or sessions
}));

//Save notification setting to MongoDB
app.use('/api/push', pushRoutes);

// Middleware
app.use(cors()); // ✅ Enable CORS for frontend-backend communication
app.use(bodyParser.json());  // To parse JSON request bodies

// Routes
app.use('/api/subscribe', subscribeRoute);  // Subscribe route
app.use(getVapidPublicKeyRoute); // Get Vapid Public Key route
app.use('/api/auth', authRoutes); // Auth routes
app.use('/api/reminders', reminderRoutes); // Reminder routes

// MongoDB connection
mongoose.connect('mongodb+srv://faijanahamed11:1h5GkqIzsW87Ghem@cluster1.ukplupe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1', { 
})
.then(() => console.log('[✔️ Connected to MongoDB]'))
.catch(err => console.error('[❌ MongoDB Error]', err));

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
