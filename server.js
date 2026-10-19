const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const centerRoutes = require('./routes/centerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const centerRequestRoutes = require('./routes/centerRequestRoutes');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' })); // Set to your frontend domain in production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple ping route to test if the server is running without DB
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong! The server is running perfectly.' });
});

// Unknown API endpoints must never fall through to the HTML app.
app.use('/api', (req, res, next) => {
  if (!/^\/(auth|centers|bookings|requests)(\/|$)/.test(req.path)) {
    return res.status(404).json({ message: 'API route not found' });
  }
  next();
});

// Ensure DB is connected before handling API requests (Crucial for Vercel Serverless)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
  }
});

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/requests', centerRequestRoutes);
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

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
  const status = err.status || 500;
  if (status >= 500) console.error(err.stack);
  res.status(status).json({ message: status === 400 ? 'Invalid JSON request body' : status === 413 ? 'Request body too large' : 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Vercel serverless functions shouldn't call app.listen directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 VD Collect Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
