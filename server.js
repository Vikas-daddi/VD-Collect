const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const centerRoutes = require('./routes/centerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const centerRequestRoutes = require('./routes/centerRequestRoutes');

connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' })); // Set to your frontend domain in production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/requests', centerRequestRoutes);

// Simple ping route to test if the server is running without DB
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong! The server is running perfectly.' });
});

// Temporary route to make admin
app.get('/api/make-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findOneAndUpdate({ email: 'admin@gmail.com' }, { role: 'admin' }, { new: true });
    if (user) {
      res.json({ message: 'Successfully made admin@gmail.com an admin!', user });
    } else {
      res.status(404).json({ message: 'User not found. Register them first!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== APP PAGES ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/collector', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'collector.html'));
});

// ========== NEW AUTH PAGES ==========
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// ========== CLIENT-SIDE ROUTING (CATCH-ALL) ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== ERROR HANDLERS ==========
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Vercel serverless functions shouldn't call app.listen directly
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 VD Collect Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;