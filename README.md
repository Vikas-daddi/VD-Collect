# ♻️ VD Collect - E-Waste Collection & Recycling Locator

**VD Collect** is a full-stack web application that helps citizens find nearby e-waste recycling centers, book pickups, and track their recycling history. It includes a powerful admin dashboard for managing centers and requests.

## 🚀 Features

- 🔐 **User Authentication** (Register/Login with JWT)
- 🗺️ **Interactive Map** (Leaflet + OpenStreetMap)
- 📍 **Find Nearest Centers** (Geolocation + Haversine distance calculation)
- 🔍 **Search Centers** (by city, pincode, or accepted items)
- 📦 **Book a Pickup** (with date validation & center pre-selection)
- 📜 **Booking History** (View all your past requests)
- 🛠️ **Admin Dashboard** (Add, Edit, Delete centers | Manage bookings)
- 📧 **Email Confirmations** (Nodemailer integration for booking confirmations)

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js (Mapping)
- OpenStreetMap (Tile Provider)

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- JSON Web Tokens (JWT)
- Bcrypt.js (Password Hashing)

**Tools:**
- Nodemon (Development)
- Git & GitHub

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- MongoDB Compass (Optional, for viewing data)

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/vd-collect.git
   cd vd-collect