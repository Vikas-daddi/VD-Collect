const mongoose = require('mongoose');
require('dotenv').config();

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from environment variables');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    }).finally(() => { connectionPromise = undefined; });
  }
  await connectionPromise;
};

module.exports = connectDB;
