const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return;
  }
  
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is missing from environment variables!');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    // Removed process.exit(1) so Vercel logs the error instead of crashing instantly
  }
};

module.exports = connectDB;
