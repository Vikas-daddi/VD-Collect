// ============================================
// VD COLLECT - MAIN APP (WITH CLIENT-SIDE ROUTING)
// ============================================

const API_URL = '/api';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const historyLink = document.getElementById('historyLink');

// ========== SET MIN DATE FOR BOOKING FORM ==========
function setMinDate() {
  const dateInput = document.getElementById('pickupDate');
  if (!dateInput) return;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const minDate = `${year}-${month}-${day}`;
  
  dateInput.setAttribute('min', minDate);
  dateInput.value = minDate;
}

// ========== ROUTER: Show/Hide Pages based on URL ==========
function router() {
  const path = window.location.pathname;

  // Hide ALL page sections
  document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');

  // Show the correct page
  if (path === '/' || path === '') {
    document.getElementById('homePage').style.display = 'block';
  } else if (path === '/map') {
    document.getElementById('mapPage').style.display = 'block';
    setTimeout(() => {
      if (!window._mapInitialized) {
        initMap();
        window._mapInitialized = true;
      }
      loadCenters();
    }, 100);
  } else if (path === '/book') {
    document.getElementById('bookPage').style.display = 'block';
    setMinDate();
    setTimeout(async () => {
      if (typeof fetchCentersData === 'function') {
        await fetchCentersData();
        if (typeof populateCenterDropdown === 'function') {
          populateCenterDropdown(window.allCenters || allCenters || []);
        }
      } else {
        if (typeof loadCenters === 'function') {
          loadCenters();
        }
      }
    }, 200);
  } else if (path === '/history') {
    document.getElementById('historyPage').style.display = 'block';
    const token = localStorage.getItem('token');
    if (!token) {
      document.getElementById('bookingHistoryList').innerHTML =
        '<p>🔒 Please <a href="/login">login</a> to view your bookings.</p>';
    } else {
      loadBookingHistory();
    }
  }
}

// ========== UPDATE UI BASED ON LOGIN STATUS ==========
function updateAuthUI() {
  const token = localStorage.getItem('token');
  if (token) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    historyLink.style.display = 'inline-block';
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    historyLink.style.display = 'none';
  }
}

// ========== LOGOUT ==========
logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  window.location.href = '/';
});

// ========== LOGIN (Redirect to login page) ==========
loginBtn?.addEventListener('click', () => {
  window.location.href = '/login';
});

// ========== REGISTER (Redirect to register page) ==========
registerBtn?.addEventListener('click', () => {
  window.location.href = '/register';
});

// ========== LOAD BOOKING HISTORY ==========
async function loadBookingHistory() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    const bookings = await response.json();
    const container = document.getElementById('bookingHistoryList');

    if (bookings.length === 0) {
      container.innerHTML = '<p>📭 You have no bookings yet. <a href="/book">Go book one!</a></p>';
      return;
    }

    container.innerHTML = bookings.map(b => {
      const centerName = b.center?.name || '⚠️ Center Deleted';
      
      let itemsText = 'N/A';
      if (b.items && Array.isArray(b.items) && b.items.length > 0) {
        itemsText = b.items.map(i => i.name || 'Unknown Item').join(', ');
      }

      return `
        <div class="booking-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${centerName}</strong>
            <span class="status-${b.status}">${b.status.toUpperCase()}</span>
          </div>
          <p>📍 ${b.pickupAddress || 'No address provided'}</p>
          <p>📅 ${b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : 'No date'}</p>
          <p>📦 Items: ${itemsText}</p>
          ${!b.center ? '<p style="color:#e53935; font-size:12px;">⚠️ This center was deleted from the system.</p>' : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load bookings:', error);
    document.getElementById('bookingHistoryList').innerHTML = 
      '<p style="color:red;">❌ Failed to load history. Please try again.</p>';
  }
}

// ========== LOADING SPINNER CONTROLS ==========
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = 'flex';
  }
}

function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

// ========== INIT ON LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  router();
});

// Re-run router when user clicks back/forward
window.addEventListener('popstate', router);

// Expose functions globally
window.loadBookingHistory = loadBookingHistory;
window.updateAuthUI = updateAuthUI;
window.setMinDate = setMinDate;
window.showLoading = showLoading;
window.hideLoading = hideLoading;