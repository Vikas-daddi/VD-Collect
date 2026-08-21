// ============================================
// VD COLLECT - ADMIN PANEL (WITH EDIT FUNCTIONALITY)
// ============================================

const API_URL = '/api';

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

let collectorsList = [];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  checkAdminAuth();
  await loadCollectors();
  loadCenters();
  loadBookings();
  loadCenterRequests();
  
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

// ========== COLLECTOR MANAGEMENT ==========
async function loadCollectors() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/auth/collectors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      collectorsList = await res.json();
    }
  } catch (err) {
    console.error('Failed to load collectors', err);
  }
}

window.assignCollector = async function(bookingId) {
  const collectorId = document.getElementById(`collector-${bookingId}`).value;
  if (!collectorId) {
    alert('Please select a collector first.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/bookings/${bookingId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ collectorId })
    });
    if (res.ok) {
      alert('✅ Collector assigned successfully!');
      loadBookings();
    } else {
      const err = await res.json();
      alert('❌ Failed to assign: ' + err.message);
    }
  } catch (error) {
    alert('❌ Error assigning collector.');
  }
};

// ========== LOAD CENTER REQUESTS ==========
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
        itemsText = b.items.map(item => `${item.name || 'Unknown Item'} (x${item.quantity || 1})`).join(', ');
      }

      const userName = b.user?.name || 'Unknown User';
      const userEmail = b.user?.email || 'No Email';
      const userPhone = b.user?.phone || 'No Phone';
      const centerName = b.center?.name || 'Unknown Center';
      const bookingDate = b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : 'No Date';
      
      const imageHtml = b.image ? `<div style="margin-top: 10px;"><p style="margin:0 0 5px 0;"><strong>📸 Uploaded Image:</strong></p><img src="${b.image}" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #ddd;" alt="Waste Image"/></div>` : '';

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
            ${imageHtml}
          </div>
          <div class="booking-actions">
            <button onclick="updateStatus('${b._id}', 'confirmed')" class="btn-confirm">✅ Confirm</button>
            <button onclick="updateStatus('${b._id}', 'completed')" class="btn-complete">✔️ Complete</button>
            <button onclick="updateStatus('${b._id}', 'cancelled')" class="btn-cancel">❌ Cancel</button>
          </div>
          ${b.status !== 'completed' && b.status !== 'cancelled' ? `
          <div style="margin-top:10px; padding: 10px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e0e0e0;">
            <label style="font-size: 13px; font-weight: bold; color: #424242;">Assign Collector:</label>
            <div style="display: flex; gap: 10px; margin-top: 5px;">
              <select id="collector-${b._id}" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
                <option value="">-- Select Collector --</option>
                ${collectorsList.map(c => `<option value="${c._id}" ${b.collector === c._id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
              <button onclick="assignCollector('${b._id}')" class="btn-confirm" style="padding: 6px 12px; font-size: 12px; background: #607d8b;">Assign</button>
            </div>
            ${b.collector ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #2e7d32;">✅ Assigned</p>` : ''}
          </div>
          ` : (b.collector ? `<div style="margin-top:10px;"><p style="font-size:13px; color:#2e7d32;"><strong>Assigned Collector:</strong> Active</p></div>` : '')}
        </div>
      `;
    }).join('');

    // Call analytics renderer
    renderAnalytics(bookings);

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

// ========== LOAD CENTER REQUESTS ==========
async function loadCenterRequests() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/requests`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) throw new Error('Failed to fetch requests');

    const requests = await response.json();
    const container = document.getElementById('requestList');

    if (requests.length === 0) {
      container.innerHTML = '<p style="color:#999;">No center requests yet.</p>';
      return;
    }

    container.innerHTML = requests.map(r => {
      const userName = r.user?.name || 'Unknown User';
      const userEmail = r.user?.email || 'No Email';
      const requestDate = new Date(r.createdAt).toLocaleDateString();
      let actionsHTML = '';

      if (r.status === 'pending') {
        actionsHTML = `
          <button onclick="approveRequest('${r._id}', '${r.location.replace(/'/g, "\\'")}')" class="btn-confirm" style="font-size: 12px; padding: 4px 8px;">✅ Approve & Add</button>
          <button onclick="updateRequestStatus('${r._id}', 'dismissed')" class="btn-cancel" style="font-size: 12px; padding: 4px 8px;">❌ Dismiss</button>
        `;
      } else {
        actionsHTML = `<span class="status-${r.status}" style="font-size: 12px;">${r.status.toUpperCase()}</span>`;
      }

      return `
        <div class="booking-item" style="padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>📍 ${r.location}</strong>
            <p style="font-size: 12px; color: #666; margin: 4px 0;">Requested by: ${userName} (${userEmail}) on ${requestDate}</p>
          </div>
          <div style="display: flex; gap: 8px;">
            ${actionsHTML}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load center requests:', error);
    document.getElementById('requestList').innerHTML = '<p style="color:red;">❌ Failed to load requests.</p>';
  }
}

// ========== UPDATE REQUEST STATUS ==========
window.updateRequestStatus = async function(requestId, status) {
  if (!confirm(`Are you sure you want to mark this request as "${status}"?`)) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      loadCenterRequests();
    } else {
      const error = await response.json();
      alert('❌ Failed to update: ' + error.message);
    }
  } catch (error) {
    alert('❌ Error updating request.');
  }
};

// ========== APPROVE & POPULATE FORM ==========
window.approveRequest = async function(requestId, location) {
  // Switch to the Manage Centers tab
  switchTab('panel-centers');

  // Populate the form with the requested location
  cityInput.value = location;
  addressInput.value = location;
  nameInput.value = 'VD Collect - ' + location;
  
  // Scroll up to form
  document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
  alert('Form populated with requested location! Please review the details and click "Auto-Detect & Add Center" to finalize.');
  
  // Mark request as approved in background
  await updateRequestStatus(requestId, 'approved');
};

// ========== TAB SWITCHING ==========
window.switchTab = function(panelId) {
  // Hide all panels
  document.querySelectorAll('.admin-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  // Remove active class from all tabs
  document.querySelectorAll('.tab-link').forEach(link => {
    link.classList.remove('active-tab');
  });

  // Show selected panel
  const activePanel = document.getElementById(panelId);
  if (activePanel) activePanel.style.display = 'block';

  // Highlight active tab link
  const activeLink = document.getElementById('tab-' + panelId);
  if (activeLink) activeLink.classList.add('active-tab');
};

// ========== ANALYTICS ==========
let categoryChart = null;
let statusChart = null;

function renderAnalytics(bookings) {
  // Aggregate Categories
  const categoryCounts = {};
  const statusCounts = {};

  bookings.forEach(b => {
    // Count status
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;

    // Count categories
    (b.items || []).forEach(item => {
      const name = item.name || 'Other';
      categoryCounts[name] = (categoryCounts[name] || 0) + (item.quantity || 1);
    });
  });

  // Render Category Chart
  const ctxCat = document.getElementById('categoryChart');
  if (ctxCat) {
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryCounts).length ? Object.keys(categoryCounts) : ['No Data'],
        datasets: [{
          data: Object.values(categoryCounts).length ? Object.values(categoryCounts) : [1],
          backgroundColor: ['#ff9800', '#4caf50', '#2196f3', '#e91e63', '#9c27b0']
        }]
      }
    });
  }

  // Render Status Chart
  const ctxStatus = document.getElementById('statusChart');
  if (ctxStatus) {
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctxStatus, {
      type: 'bar',
      data: {
        labels: Object.keys(statusCounts).length ? Object.keys(statusCounts) : ['No Data'],
        datasets: [{
          label: 'Bookings',
          data: Object.values(statusCounts).length ? Object.values(statusCounts) : [0],
          backgroundColor: '#7ec8e3'
        }]
      }
    });
  }
}


// Expose functions globally
window.loadCenters = loadCenters;
window.loadBookings = loadBookings;
window.editCenter = editCenter;
window.deleteCenter = deleteCenter;
window.updateStatus = updateStatus;
window.loadCenterRequests = loadCenterRequests;
window.updateRequestStatus = updateRequestStatus;
window.approveRequest = approveRequest;