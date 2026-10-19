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
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login or register to access the map and find centers.');
      window.location.href = '/login';
      return;
    }
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
  } else if (path === '/dashboard') {
    document.getElementById('dashboardPage').style.display = 'block';
    const token = localStorage.getItem('token');
    if (!token) {
      document.getElementById('bookingHistoryList').innerHTML =
        '<p>🔒 Please <a href="/login">login</a> to view your dashboard.</p>';
    } else {
      loadDashboard();
    }
  }
}

// ========== UPDATE UI BASED ON LOGIN STATUS ==========
function updateAuthUI() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminLink = document.getElementById('adminLink');
  const collectorLink = document.getElementById('collectorLink');
  const findCentersLink = document.getElementById('findCentersLink');
  const bookPickupLink = document.getElementById('bookPickupLink');
  
  if (token) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    
    if (user.role === 'admin') {
      if (adminLink) adminLink.style.display = 'inline-block';
      if (collectorLink) collectorLink.style.display = 'none';
      historyLink.style.display = 'none';
      if (findCentersLink) findCentersLink.style.display = 'none';
      if (bookPickupLink) bookPickupLink.style.display = 'none';
    } else if (user.role === 'collector') {
      if (adminLink) adminLink.style.display = 'none';
      if (collectorLink) collectorLink.style.display = 'inline-block';
      historyLink.style.display = 'none';
      if (findCentersLink) findCentersLink.style.display = 'none';
      if (bookPickupLink) bookPickupLink.style.display = 'none';
    } else {
      if (adminLink) adminLink.style.display = 'none';
      if (collectorLink) collectorLink.style.display = 'none';
      historyLink.style.display = 'inline-block';
      if (findCentersLink) findCentersLink.style.display = 'inline-block';
      if (bookPickupLink) bookPickupLink.style.display = 'inline-block';
    }
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    historyLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
    if (collectorLink) collectorLink.style.display = 'none';
    if (findCentersLink) findCentersLink.style.display = 'inline-block';
    if (bookPickupLink) bookPickupLink.style.display = 'inline-block';
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

// ========== MAP BUTTONS AUTH CHECK ==========
const checkAuthClick = (e) => {
  if (!localStorage.getItem('token')) {
    e.preventDefault();
    alert('Please login or register to access this feature.');
    window.location.href = '/login';
  }
};

document.getElementById('heroFindBtn')?.addEventListener('click', checkAuthClick);
document.getElementById('heroExploreBtn')?.addEventListener('click', checkAuthClick);
document.querySelector('.nav-links a[href="/map"]')?.addEventListener('click', checkAuthClick);


let impactChartInstance = null;

// ========== LOAD DASHBOARD ==========
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    // 1. Update Gamification Stats
    const userRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      document.getElementById('dashboardPoints').textContent = userData.points || 0;
      document.getElementById('dashboardBadges').textContent = (userData.badges || []).length;
    }

    // 2. Load Bookings
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
      if (impactChartInstance) impactChartInstance.destroy();
      return;
    }

    container.innerHTML = bookings.map(b => {
      const centerName = b.center?.name || '⚠️ Center Deleted';
      let itemsText = 'N/A';
      if (b.items && Array.isArray(b.items) && b.items.length > 0) {
        itemsText = b.items.map(i => `${i.name || 'Unknown Item'} (x${i.quantity || 1})`).join(', ');
      }
      return `
        <div class="booking-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${escapeHTML(centerName)}</strong>
            <span class="status-${b.status}">${b.status.toUpperCase()}</span>
          </div>
          <p>📍 ${escapeHTML(b.pickupAddress || 'No address provided')}</p>
          <p>📅 ${b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : 'No date'}</p>
          <p>📦 Items: ${escapeHTML(itemsText)}</p>
          ${!b.center ? '<p style="color:#e53935; font-size:12px;">⚠️ This center was deleted from the system.</p>' : ''}
        </div>
      `;
    }).join('');

    // 3. Render Chart
    renderImpactChart(bookings);

  } catch (error) {
    console.error('Failed to load dashboard:', error);
    document.getElementById('bookingHistoryList').innerHTML = 
      '<p style="color:red;">❌ Failed to load dashboard. Please try again.</p>';
  }
}

function renderImpactChart(bookings) {
  const ctx = document.getElementById('impactChart');
  if (!ctx) return;

  // Aggregate items by category
  const categoryCounts = {};
  bookings.forEach(b => {
    if (b.status === 'completed' || b.status === 'confirmed') {
      (b.items || []).forEach(item => {
        const name = item.name || 'Other';
        categoryCounts[name] = (categoryCounts[name] || 0) + (item.quantity || 1);
      });
    }
  });

  const labels = Object.keys(categoryCounts);
  const data = Object.values(categoryCounts);

  if (impactChartInstance) {
    impactChartInstance.destroy();
  }

  impactChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No Data Yet'],
      datasets: [{
        label: 'Items Recycled',
        data: data.length ? data : [0],
        backgroundColor: '#7ec8e3',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
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

  // Smart Find Logic
  const heroSmartFindBtn = document.getElementById('heroSmartFindBtn');
  if (heroSmartFindBtn) {
    heroSmartFindBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const wasteType = document.getElementById('heroWasteType').value;
      if (!wasteType) {
        alert('Please select what you are recycling first!');
        return;
      }
      
      // Save preference
      sessionStorage.setItem('preferredWasteType', wasteType);
      
      // Navigate to Map
      window.history.pushState({}, '', '/map');
      router();
    });
  }
});

// Re-run router when user clicks back/forward
window.addEventListener('popstate', router);

// Expose functions globally
window.loadBookingHistory = loadBookingHistory;
window.updateAuthUI = updateAuthUI;
window.setMinDate = setMinDate;
window.showLoading = showLoading;
window.hideLoading = hideLoading;