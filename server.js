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
    const rawCenters = [
      // Maharashtra
      { name: 'Mumbai Eco Hub', coords: [19.0760, 72.8777], address: 'Andheri East', city: 'Mumbai', phone: '+91-9876543210' },
      { name: 'Pune Green Collect', coords: [18.5204, 73.8567], address: 'Shivaji Nagar', city: 'Pune', phone: '+91-9876543211' },
      // Karnataka
      { name: 'Bengaluru Tech Recycle', coords: [12.9716, 77.5946], address: 'Koramangala', city: 'Bengaluru', phone: '+91-9876543213' },
      { name: 'Mysuru Eco Center', coords: [12.2958, 76.6394], address: 'Gokulam', city: 'Mysuru', phone: '+91-9876543214' },
      // Delhi / NCR
      { name: 'New Delhi E-Waste Hub', coords: [28.6139, 77.2090], address: 'Connaught Place', city: 'Delhi', phone: '+91-9876543216' },
      { name: 'Gurugram CleanTech', coords: [28.4595, 77.0266], address: 'Cyber City', city: 'Gurugram', phone: '+91-9876543217' },
      // Tamil Nadu
      { name: 'Chennai Ocean Collect', coords: [13.0827, 80.2707], address: 'T Nagar', city: 'Chennai', phone: '+91-9876543219' },
      { name: 'Coimbatore Recyclers', coords: [11.0168, 76.9558], address: 'RS Puram', city: 'Coimbatore', phone: '+91-9876543220' },
      // Telangana & AP
      { name: 'Hyderabad Cyber Collect', coords: [17.3850, 78.4867], address: 'Banjara Hills', city: 'Hyderabad', phone: '+91-9876543221' },
      { name: 'Visakhapatnam Eco', coords: [17.6868, 83.2185], address: 'MVP Colony', city: 'Vizag', phone: '+91-9876543222' },
      // West Bengal
      { name: 'Kolkata Heritage Recycle', coords: [22.5726, 88.3639], address: 'Salt Lake', city: 'Kolkata', phone: '+91-9876543223' },
      { name: 'Siliguri Green', coords: [26.7271, 88.4336], address: 'Pradhan Nagar', city: 'Siliguri', phone: '+91-9876543224' },
      // Gujarat
      { name: 'Ahmedabad Scrap Hub', coords: [23.0225, 72.5714], address: 'Vastrapur', city: 'Ahmedabad', phone: '+91-9876543225' },
      { name: 'Surat Eco Center', coords: [21.1702, 72.8311], address: 'Adajan', city: 'Surat', phone: '+91-9876543226' },
      // Rajasthan
      { name: 'Jaipur Desert Green', coords: [26.9124, 75.7873], address: 'Malviya Nagar', city: 'Jaipur', phone: '+91-9876543227' },
      { name: 'Jodhpur Collect', coords: [26.2389, 73.0243], address: 'Sardarpura', city: 'Jodhpur', phone: '+91-9876543228' },
      // Kerala
      { name: 'Kochi Backwater Recycle', coords: [9.9312, 76.2673], address: 'Marine Drive', city: 'Kochi', phone: '+91-9876543229' },
      // Punjab
      { name: 'Chandigarh Clean Collect', coords: [30.7333, 76.7794], address: 'Sector 17', city: 'Chandigarh', phone: '+91-9876543231' },

      // === REST OF THE WORLD ===
      { name: 'New York Metro Recycle', coords: [40.7128, -74.0060], address: 'Manhattan', city: 'New York', phone: '+1-555-123-4567' },
      { name: 'San Francisco Bay Eco', coords: [37.7749, -122.4194], address: 'SOMA', city: 'San Francisco', phone: '+1-555-123-4568' },
      { name: 'London Central Recycle', coords: [51.5074, -0.1276], address: 'Westminster', city: 'London', phone: '+44-20-7946-0958' },
      { name: 'Berlin Eco Collect', coords: [52.5200, 13.4050], address: 'Mitte', city: 'Berlin', phone: '+49-30-123456' },
      { name: 'Tokyo Tech Recycle', coords: [35.6895, 139.6917], address: 'Shinjuku', city: 'Tokyo', phone: '+81-3-1234-5678' },
      { name: 'Singapore Green Island', coords: [1.3521, 103.8198], address: 'Orchard Road', city: 'Singapore', phone: '+65-6123-4567' },
      { name: 'Dubai Desert Eco', coords: [25.2048, 55.2708], address: 'Downtown', city: 'Dubai', phone: '+971-4-123-4567' },
      { name: 'Sydney Ocean Collect', coords: [-33.8688, 151.2093], address: 'CBD', city: 'Sydney', phone: '+61-2-1234-5678' },
      { name: 'Sao Paulo Recycle', coords: [-23.5505, -46.6333], address: 'Paulista', city: 'Sao Paulo', phone: '+55-11-1234-5678' }
    ];
    
    const seedCenters = rawCenters.map(c => ({
      name: c.name,
      latitude: c.coords[0],
      longitude: c.coords[1],
      address: c.address,
      city: c.city,
      phone: c.phone,
      isActive: true,
      acceptedItems: ['Laptops', 'Mobile Phones', 'Batteries', 'Chargers', 'TVs']
    }));

    await Center.deleteMany({});
    await Center.insertMany(seedCenters);
    res.json({ message: `Successfully seeded ${seedCenters.length} centers globally! Check your map.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Temporary route to seed collectors
app.get('/api/seed-collectors', async (req, res) => {
  try {
    const User = require('./models/User');
    const existing = await User.findOne({ email: 'collector1@gmail.com' });
    if (existing) {
      return res.json({ message: 'Collectors already seeded! Use collector1@gmail.com and password: collector123' });
    }
    
    const collector1 = new User({ name: 'Ramesh Collector', email: 'collector1@gmail.com', password: 'collector123', role: 'collector', phone: '1111111111', address: 'Mumbai' });
    const collector2 = new User({ name: 'Suresh Collector', email: 'collector2@gmail.com', password: 'collector123', role: 'collector', phone: '2222222222', address: 'Delhi' });
    
    await collector1.save();
    await collector2.save();
    
    res.json({ message: 'Successfully seeded 2 collectors! Login with collector1@gmail.com / collector123' });
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