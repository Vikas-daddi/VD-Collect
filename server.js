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

// Temporary route to seed production centers
app.get('/api/seed-centers', async (req, res) => {
  try {
    const Center = require('./models/Center');
    const seedCenters = [
      // Maharashtra
      { name: 'Mumbai Eco Hub', location: { type: 'Point', coordinates: [72.8777, 19.0760] }, address: 'Andheri East, Mumbai, MH', status: 'active', contactInfo: '+91-9876543210' },
      { name: 'Pune Green Collect', location: { type: 'Point', coordinates: [73.8567, 18.5204] }, address: 'Shivaji Nagar, Pune, MH', status: 'active', contactInfo: '+91-9876543211' },
      // Karnataka
      { name: 'Bengaluru Tech Recycle', location: { type: 'Point', coordinates: [77.5946, 12.9716] }, address: 'Koramangala, Bengaluru, KA', status: 'active', contactInfo: '+91-9876543213' },
      { name: 'Mysuru Eco Center', location: { type: 'Point', coordinates: [76.6394, 12.2958] }, address: 'Gokulam, Mysuru, KA', status: 'active', contactInfo: '+91-9876543214' },
      // Delhi / NCR
      { name: 'New Delhi E-Waste Hub', location: { type: 'Point', coordinates: [77.2090, 28.6139] }, address: 'Connaught Place, Delhi', status: 'active', contactInfo: '+91-9876543216' },
      { name: 'Gurugram CleanTech', location: { type: 'Point', coordinates: [77.0266, 28.4595] }, address: 'Cyber City, Gurugram, HR', status: 'active', contactInfo: '+91-9876543217' },
      // Tamil Nadu
      { name: 'Chennai Ocean Collect', location: { type: 'Point', coordinates: [80.2707, 13.0827] }, address: 'T Nagar, Chennai, TN', status: 'active', contactInfo: '+91-9876543219' },
      { name: 'Coimbatore Recyclers', location: { type: 'Point', coordinates: [76.9558, 11.0168] }, address: 'RS Puram, Coimbatore, TN', status: 'active', contactInfo: '+91-9876543220' },
      // Telangana & AP
      { name: 'Hyderabad Cyber Collect', location: { type: 'Point', coordinates: [78.4867, 17.3850] }, address: 'Banjara Hills, Hyderabad, TG', status: 'active', contactInfo: '+91-9876543221' },
      { name: 'Visakhapatnam Eco', location: { type: 'Point', coordinates: [83.2185, 17.6868] }, address: 'MVP Colony, Vizag, AP', status: 'active', contactInfo: '+91-9876543222' },
      // West Bengal
      { name: 'Kolkata Heritage Recycle', location: { type: 'Point', coordinates: [88.3639, 22.5726] }, address: 'Salt Lake, Kolkata, WB', status: 'active', contactInfo: '+91-9876543223' },
      { name: 'Siliguri Green', location: { type: 'Point', coordinates: [88.4336, 26.7271] }, address: 'Pradhan Nagar, Siliguri, WB', status: 'active', contactInfo: '+91-9876543224' },
      // Gujarat
      { name: 'Ahmedabad Scrap Hub', location: { type: 'Point', coordinates: [72.5714, 23.0225] }, address: 'Vastrapur, Ahmedabad, GJ', status: 'active', contactInfo: '+91-9876543225' },
      { name: 'Surat Eco Center', location: { type: 'Point', coordinates: [72.8311, 21.1702] }, address: 'Adajan, Surat, GJ', status: 'active', contactInfo: '+91-9876543226' },
      // Rajasthan
      { name: 'Jaipur Desert Green', location: { type: 'Point', coordinates: [75.7873, 26.9124] }, address: 'Malviya Nagar, Jaipur, RJ', status: 'active', contactInfo: '+91-9876543227' },
      { name: 'Jodhpur Collect', location: { type: 'Point', coordinates: [73.0243, 26.2389] }, address: 'Sardarpura, Jodhpur, RJ', status: 'active', contactInfo: '+91-9876543228' },
      // Kerala
      { name: 'Kochi Backwater Recycle', location: { type: 'Point', coordinates: [76.2673, 9.9312] }, address: 'Marine Drive, Kochi, KL', status: 'active', contactInfo: '+91-9876543229' },
      // Punjab
      { name: 'Chandigarh Clean Collect', location: { type: 'Point', coordinates: [76.7794, 30.7333] }, address: 'Sector 17, Chandigarh', status: 'active', contactInfo: '+91-9876543231' },

      // === REST OF THE WORLD ===
      { name: 'New York Metro Recycle', location: { type: 'Point', coordinates: [-74.0060, 40.7128] }, address: 'Manhattan, New York, USA', status: 'active', contactInfo: '+1-555-123-4567' },
      { name: 'San Francisco Bay Eco', location: { type: 'Point', coordinates: [-122.4194, 37.7749] }, address: 'SOMA, San Francisco, USA', status: 'active', contactInfo: '+1-555-123-4568' },
      { name: 'London Central Recycle', location: { type: 'Point', coordinates: [-0.1276, 51.5074] }, address: 'Westminster, London, UK', status: 'active', contactInfo: '+44-20-7946-0958' },
      { name: 'Berlin Eco Collect', location: { type: 'Point', coordinates: [13.4050, 52.5200] }, address: 'Mitte, Berlin, Germany', status: 'active', contactInfo: '+49-30-123456' },
      { name: 'Tokyo Tech Recycle', location: { type: 'Point', coordinates: [139.6917, 35.6895] }, address: 'Shinjuku, Tokyo, Japan', status: 'active', contactInfo: '+81-3-1234-5678' },
      { name: 'Singapore Green Island', location: { type: 'Point', coordinates: [103.8198, 1.3521] }, address: 'Orchard Road, Singapore', status: 'active', contactInfo: '+65-6123-4567' },
      { name: 'Dubai Desert Eco', location: { type: 'Point', coordinates: [55.2708, 25.2048] }, address: 'Downtown Dubai, UAE', status: 'active', contactInfo: '+971-4-123-4567' },
      { name: 'Sydney Ocean Collect', location: { type: 'Point', coordinates: [151.2093, -33.8688] }, address: 'CBD, Sydney, Australia', status: 'active', contactInfo: '+61-2-1234-5678' },
      { name: 'Sao Paulo Recycle', location: { type: 'Point', coordinates: [-46.6333, -23.5505] }, address: 'Paulista, Sao Paulo, Brazil', status: 'active', contactInfo: '+55-11-1234-5678' }
    ];
    await Center.deleteMany({});
    await Center.insertMany(seedCenters);
    res.json({ message: `Successfully seeded ${seedCenters.length} centers globally! Check your map.` });
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