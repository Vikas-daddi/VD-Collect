# ⚡ VD Collect - E-Waste Collection & Recycling Locator

**Live Demo:** [https://vd-collect.vercel.app](https://vd-collect.vercel.app)

**VD Collect** is a full-stack web application that helps citizens find nearby e-waste recycling centers, book pickups, and track their recycling history. It includes a powerful Admin Dashboard for managing centers and requests, as well as a dedicated Collector Portal for field workers to manage and complete their assigned pickups.

## 🚀 Features

### For Citizens:
- 🗺️ **Interactive Map**: Find nearby drop-off locations with live Geolocation integration.
- 🔍 **Smart Search**: Filter centers by exact waste category, city, or pincode.
- 📦 **Book Pickups**: Schedule home pickups for e-waste directly with centers.
- 🏆 **Gamification & Impact Dashboard**: Earn "Eco Points" and "Eco Warrior" badges for successful pickups. Track your recycling impact with real-time charts (Chart.js).

### For Collectors:
- 🚚 **Dedicated Collector Portal**: A streamlined view for field workers.
- 🗺️ **Live Directions**: Click to open Google Maps for immediate routing to the citizen's house.
- ✅ **One-Click Completion**: Mark jobs as collected while on the go.

### For Admins:
- 📊 **Analytics Dashboard**: Visual charts for category breakdowns and booking status metrics.
- 🛠️ **Manage Centers**: Full CRUD capabilities (Add, Edit, Delete) for recycling centers with automatic address geocoding (Nominatim).
- 📋 **Booking & Dispatch**: View all citizen requests, approve/cancel them, and seamlessly assign them to Collectors.
- 📬 **Manage Requests**: Users can request new centers in their neighborhood; admins can one-click approve and auto-fill the center creation form.

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js & OpenStreetMap (Mapping)
- Chart.js (Analytics)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose ODM (Database)
- JSON Web Tokens (JWT) for secure role-based auth (Citizen, Admin, Collector)
- Bcrypt.js (Password Hashing)
- Nodemailer (Email Confirmations - Optional)

## ⚙️ Test Accounts

If testing on the live demo, you can use these accounts to explore the different roles:

**Admin Account:**
- **Email:** `admin@gmail.com`
- **Password:** `admin`

**Collector Account:**
- **Email:** `collector1@gmail.com`
- **Password:** `collector123`

## 🚀 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vikas-daddi/VD-Collect.git
   cd VD-Collect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/vdcollect
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Run the server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:5000`.

## 🌍 Vercel Deployment

This project is fully optimized for **Vercel Serverless Functions**.
- `server.js` exports the Express `app` directly for Vercel.
- Database connections are awaited on every API route via middleware to prevent "Mongoose buffering timed out" cold-start errors.
- A `vercel.json` file is included to handle client-side routing rewrites and API routing.