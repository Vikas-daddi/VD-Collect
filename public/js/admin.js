// ============================================
// VD COLLECT - ADMIN PANEL (WITH EDIT FUNCTIONALITY)
// ============================================

const API_URL = 'http://localhost:5000/api';

// DOM Elements
const form = document.getElementById('centerForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editIdInput = document.getElementById('editId');

// Center form fields
const nameInput = document.getElementById('centerName');
const addressInput = document.getElementById('centerAddress');
const cityInput = document.getElementById('centerCity');
const latInput = document.getElementById('centerLat');
const lngInput = document.getElementById('centerLng');
const phoneInput = document.getElementById('centerPhone');
const timingInput = document.getElementById('centerTiming');
const itemsInput = document.getElementById('centerItems');

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  loadCenters();
  loadBookings();
  
  form.addEventListener('submit', handleFormSubmit);
  cancelEditBtn.addEventListener('click', resetForm);
  
  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
});

function checkAdminAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || user.role !== 'admin') {
    alert('Admin access required. Please login as admin.');
    window.location.href = '/';
  }
}

// ========== GEOCODE (Auto-Detect Lat/Lng if fields are empty) ==========
async function getCoordinates(address, city) {
  const query = `${address}, ${city}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VD-Collect-Admin/1.0' }
    });
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } else {
      console.warn('⚠️ Address not found, using default (Delhi).');
      return { lat: 28.6139, lng: 77.2090 };
    }
  } catch (error) {
    console.error('❌ Geocoding failed:', error);
    return { lat: 28.6139, lng: 77.2090 };
  }
}

// ========== HANDLE FORM SUBMIT (Add OR Update) ==========
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const editId = editIdInput.value;
  const isEditing = editId !== '';

  const name = nameInput.value.trim();
  const address = addressInput.value.trim();
  const city = cityInput.value.trim();
  const phone = phoneInput.value.trim();
  const timing = timingInput.value.trim();
  const itemsRaw = itemsInput.value.trim();
  
  // Get Lat/Lng: prioritize manual entry, else auto-detect
  let latitude = parseFloat(latInput.value.trim());
  let longitude = parseFloat(lngInput.value.trim());

  if (!name || !address || !city) {
    alert('Please fill in Name, Address, and City.');
    return;
  }

  // If Lat/Lng are empty or invalid, auto-detect
  if (isNaN(latitude) || isNaN(longitude)) {
    submitBtn.textContent = '⏳ Finding location...';
    submitBtn.disabled = true;
    
    try {
      const coords = await getCoordinates(address, city);
      latitude = coords.lat;
      longitude = coords.lng;
    } catch (err) {
      alert('Failed to auto-detect location. Please enter Latitude/Longitude manually.');
      submitBtn.textContent = isEditing ? 'Update Center' : '🔍 Auto-Detect & Add Center';
      submitBtn.disabled = false;
      return;
    }
  }

  const data = {
    name,
    address,
    city,
    latitude,
    longitude,
    phone: phone || 'N/A',
    timing: timing || '9 AM - 6 PM',
    acceptedItems: itemsRaw ? itemsRaw.split(',').map(i => i.trim()).filter(i => i) : ['Electronics'],
  };

  const token = localStorage.getItem('token');
  let url = `${API_URL}/centers`;
  let method = 'POST';
  let successMsg = '✅ Center added successfully!';

  if (isEditing) {
    url = `${API_URL}/centers/${editId}`;
    method = 'PUT';
    successMsg = '✅ Center updated successfully!';
  }

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert(successMsg);
      loadCenters();
      resetForm();
    } else {
      const error = await response.json();
      alert('❌ Failed: ' + error.message);
    }
  } catch (error) {
    alert('❌ Error saving center.');
    console.error(error);
  } finally {
    submitBtn.textContent = isEditing ? 'Update Center' : '🔍 Auto-Detect & Add Center';
    submitBtn.disabled = false;
  }
}

// ========== LOAD CENTERS (With Edit Buttons) ==========
async function loadCenters() {
  try {
    const response = await fetch(`${API_URL}/centers`);
    const centers = await response.json();
    const container = document.getElementById('centerList');
    
    if (centers.length === 0) {
      container.innerHTML = '<p style="color:#999;">No centers added yet.</p>';
      return;
    }

    container.innerHTML = centers.map(c => `
      <div class="center-item">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <div>
            <strong>${c.name}</strong> 
            <span class="badge">${c.city}</span>
            <p>${c.address}</p>
            <small>📞 ${c.phone || 'N/A'} | 🕐 ${c.timing || 'N/A'}</small>
            <br/><small style="color:#aaa;">📍 ${c.latitude}, ${c.longitude}</small>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button onclick="editCenter('${c._id}')" class="btn-edit">✏️ Edit</button>
            <button onclick="deleteCenter('${c._id}')" class="btn-delete">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load centers:', error);
    document.getElementById('centerList').innerHTML = '<p style="color:red;">❌ Failed to load centers.</p>';
  }
}

// ========== EDIT CENTER (Populate Form) ==========
window.editCenter = async function(id) {
  try {
    const response = await fetch(`${API_URL}/centers`);
    const centers = await response.json();
    const center = centers.find(c => c._id === id);
    
    if (!center) {
      alert('Center not found.');
      return;
    }

    // Populate form
    editIdInput.value = center._id;
    nameInput.value = center.name;
    addressInput.value = center.address;
    cityInput.value = center.city;
    latInput.value = center.latitude;
    lngInput.value = center.longitude;
    phoneInput.value = center.phone || '';
    timingInput.value = center.timing || '';
    itemsInput.value = center.acceptedItems.join(', ');

    // Change UI
    formTitle.textContent = '✏️ Edit Center';
    submitBtn.textContent = 'Update Center';
    cancelEditBtn.style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    alert('Error loading center data.');
    console.error(error);
  }
};

// ========== DELETE CENTER ==========
window.deleteCenter = async function(id) {
  if (!confirm('Are you sure you want to delete this center?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/centers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      alert('🗑️ Center deleted successfully.');
      loadCenters();
    } else {
      const error = await response.json();
      alert('❌ Failed to delete: ' + error.message);
    }
  } catch (error) {
    alert('❌ Error deleting center.');
  }
};

// ========== RESET FORM (Cancel Edit) ==========
function resetForm() {
  editIdInput.value = '';
  form.reset();
  formTitle.textContent = '➕ Add New Center';
  submitBtn.textContent = '🔍 Auto-Detect & Add Center';
  cancelEditBtn.style.display = 'none';
}

// ========== LOAD BOOKINGS ==========
async function loadBookings() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) throw new Error('Failed to fetch bookings');

    const bookings = await response.json();
    const container = document.getElementById('bookingList');

    if (bookings.length === 0) {
      container.innerHTML = '<p style="color:#999;">No pickup requests yet.</p>';
      return;
    }

    container.innerHTML = bookings.map(b => {
      let itemsText = 'N/A';
      if (b.items && Array.isArray(b.items) && b.items.length > 0) {
        itemsText = b.items.map(item => item.name || 'Unknown Item').join(', ');
      }

      const userName = b.user?.name || 'Unknown User';
      const userEmail = b.user?.email || 'No Email';
      const userPhone = b.user?.phone || 'No Phone';
      const centerName = b.center?.name || 'Unknown Center';
      const bookingDate = b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : 'No Date';

      return `
        <div class="booking-item">
          <div class="booking-header">
            <strong>👤 ${userName}</strong>
            <span class="status-${b.status}">${b.status.toUpperCase()}</span>
          </div>
          <div class="booking-details">
            <p>📧 ${userEmail} | 📞 ${userPhone}</p>
            <p>📍 Center: ${centerName}</p>
            <p>📦 Items: <strong>${itemsText}</strong></p>
            <p>📅 Pickup Date: ${bookingDate}</p>
            <p>🏠 Address: ${b.pickupAddress || 'N/A'}</p>
          </div>
          <div class="booking-actions">
            <button onclick="updateStatus('${b._id}', 'confirmed')" class="btn-confirm">✅ Confirm</button>
            <button onclick="updateStatus('${b._id}', 'completed')" class="btn-complete">✔️ Complete</button>
            <button onclick="updateStatus('${b._id}', 'cancelled')" class="btn-cancel">❌ Cancel</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load bookings:', error);
    document.getElementById('bookingList').innerHTML = '<p style="color:red;">❌ Failed to load bookings.</p>';
  }
}

// ========== UPDATE BOOKING STATUS ==========
window.updateStatus = async function(bookingId, status) {
  if (!confirm(`Are you sure you want to mark this booking as "${status}"?`)) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      alert(`✅ Booking marked as ${status}!`);
      loadBookings();
    } else {
      const error = await response.json();
      alert('❌ Failed to update: ' + error.message);
    }
  } catch (error) {
    alert('❌ Error updating booking.');
  }
};

// Expose functions globally
window.loadCenters = loadCenters;
window.loadBookings = loadBookings;
window.editCenter = editCenter;
window.deleteCenter = deleteCenter;
window.updateStatus = updateStatus;