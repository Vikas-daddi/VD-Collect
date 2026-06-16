// ============================================
// VD COLLECT - MAP LOGIC (FULL VERSION)
// Features: Nearest centers, Search, Booking, Click-to-Book, Date Validation
// ============================================

let map;
let markersLayer;
let userMarker = null;
let selectedCenterId = null;
let allCenters = [];
let userLat = null;
let userLng = null;

// Prevent double initialization when navigating back/forth
if (typeof window._mapInitialized === 'undefined') {
  window._mapInitialized = false;
}

// ============= INIT MAP =============
document.addEventListener('DOMContentLoaded', () => {
  setupBookingForm();
  setupSearch();
  setupNearestButton();
});

function initMap() {
  if (window._mapInitialized) {
    console.log('ℹ️ Map already initialized, skipping.');
    return;
  }

  console.log('🗺️ Initializing map...');
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  map = L.map('map').setView([defaultLat, defaultLng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  window._mapInitialized = true;
}

// ============= FETCH CENTERS (UPDATES GLOBAL allCenters) =============
async function fetchCentersData() {
  try {
    const response = await fetch(`${API_URL}/centers`);
    let centers = await response.json();

    if (centers && centers.length > 0) {
      console.log('✅ Fetched centers from Database:', centers.length);
      allCenters = centers;
      window.allCenters = centers; // Make it globally available
      return centers;
    }

    console.warn('⚠️ No centers in database.');
    allCenters = [];
    window.allCenters = [];
    return [];
  } catch (error) {
    console.error('❌ Error fetching centers:', error);
    allCenters = [];
    window.allCenters = [];
    return [];
  }
}

// ============= LOAD CENTERS (FOR THE MAP PAGE) =============
async function loadCenters() {
  // First, fetch the data (always works)
  await fetchCentersData();

  // Check if map container is visible
  const mapContainer = document.getElementById('map');
  if (!mapContainer || mapContainer.offsetParent === null) {
    console.warn('⚠️ Map container not visible, skipping display.');
    // Still populate dropdown if we are on the booking page
    if (document.getElementById('bookPage')?.style?.display !== 'none') {
      populateCenterDropdown(allCenters);
    }
    return;
  }

  // If map isn't initialized, initialize it
  if (!window._mapInitialized) {
    initMap();
  }

  if (allCenters.length === 0) {
    document.getElementById('centerInfo').innerHTML = `
      <p>📢 No collection centers added yet.
      <br/>Please <a href="/admin" style="color:#f9a825;">login as Admin</a> to add centers.</p>
    `;
    displayCenters([]);
    populateCenterDropdown([]);
    return;
  }

  displayCenters(allCenters);
  populateCenterDropdown(allCenters);
}

// ============= DISPLAY CENTERS ON MAP =============
function displayCenters(centers) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  if (!centers || centers.length === 0) {
    return;
  }

  centers.forEach((center) => {
    const marker = L.marker([center.latitude, center.longitude])
      .addTo(markersLayer)
      .bindPopup(`
        <strong>${center.name}</strong><br>
        ${center.address}<br>
        📞 ${center.phone || 'N/A'}<br>
        🕐 ${center.timing || 'N/A'}<br>
        <button onclick="selectCenter('${center._id}')" style="margin-top:5px;padding:5px 15px;background:#f9a825;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">Book Pickup</button>
      `);
    marker.on('click', () => showCenterDetails(center));
  });

  if (userLat && userLng && centers.length > 0) {
    try {
      const group = L.featureGroup([userMarker, ...markersLayer.getLayers()]);
      map.fitBounds(group.getBounds().pad(0.2));
    } catch (e) {
      map.setView([centers[0].latitude, centers[0].longitude], 13);
    }
  } else if (centers.length > 0) {
    map.setView([centers[0].latitude, centers[0].longitude], 13);
  }
}

// ============= SHOW CENTER DETAILS =============
function showCenterDetails(center) {
  const infoDiv = document.getElementById('centerInfo');
  if (!infoDiv) return;

  let distanceText = '';
  if (userLat && userLng) {
    const dist = getDistance(userLat, userLng, center.latitude, center.longitude);
    distanceText = `<p>📏 Distance: <strong>${dist.toFixed(2)} km</strong> from you</p>`;
  }

  infoDiv.innerHTML = `
    <h3>${center.name}</h3>
    <p>📍 ${center.address}</p>
    <p>📞 ${center.phone || 'N/A'}</p>
    <p>🕐 ${center.timing || '9 AM - 6 PM'}</p>
    <p><strong>Accepted Items:</strong> ${center.acceptedItems.join(', ')}</p>
    ${distanceText}
    <button class="btn-primary" onclick="selectCenter('${center._id}')">Book Pickup Here</button>
  `;
  selectedCenterId = center._id;
}

// ============= SELECT CENTER FOR BOOKING (NAVIGATES TO /book) =============
function selectCenter(centerId) {
  // Store the center ID in session storage so we can retrieve it on the booking page
  sessionStorage.setItem('preSelectedCenterId', centerId);
  
  // Navigate to the booking page
  window.location.href = '/book';
}

// ============= POPULATE DROPDOWN =============
function populateCenterDropdown(centers) {
  const select = document.getElementById('centerSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Select a collection center</option>';
  if (!centers || centers.length === 0) {
    select.innerHTML += '<option value="" disabled>No centers available</option>';
    return;
  }

  centers.forEach(center => {
    const option = document.createElement('option');
    option.value = center._id;
    option.textContent = `${center.name} - ${center.city}`;
    select.appendChild(option);
  });

  // Check if there's a pre-selected center ID from session storage
  const preSelectedId = sessionStorage.getItem('preSelectedCenterId');
  if (preSelectedId) {
    for (let option of select.options) {
      if (option.value === preSelectedId) {
        option.selected = true;
        sessionStorage.removeItem('preSelectedCenterId');
        break;
      }
    }
  }
}

// ============= BOOKING FORM =============
function setupBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.removeEventListener('submit', handleBookingSubmit);
  form.addEventListener('submit', handleBookingSubmit);
}

// 🔥 COMPLETE FUNCTION WITH DATE VALIDATION
async function handleBookingSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first to book a pickup!');
    return;
  }

  const centerId = document.getElementById('centerSelect').value;
  if (!centerId) {
    alert('Please select a collection center.');
    return;
  }

  const pickupDate = document.getElementById('pickupDate').value;
  if (!pickupDate) {
    alert('Please select a pickup date.');
    return;
  }

  const today = new Date();
  const selectedDate = new Date(pickupDate);
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    alert('❌ Pickup date cannot be in the past. Please select today or a future date.');
    return;
  }

  showLoading();

  const bookingData = {
    centerId: centerId,
    pickupAddress: document.getElementById('pickupAddress').value,
    pickupDate: pickupDate,
    items: document.getElementById('itemsList').value.split(',').map(i => ({ name: i.trim(), quantity: 1 })),
  };

  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (response.ok) {
      // 🔥 Store booking details for success page
      const select = document.getElementById('centerSelect');
      const centerName = select.options[select.selectedIndex]?.text || 'N/A';
      
      sessionStorage.setItem('success_centerName', centerName);
      sessionStorage.setItem('success_pickupDate', pickupDate);
      sessionStorage.setItem('success_items', document.getElementById('itemsList').value);
      sessionStorage.setItem('success_address', document.getElementById('pickupAddress').value);

      // Redirect to success page
      window.location.href = '/success';
    } else {
      const error = await response.json();
      alert('❌ Booking failed: ' + error.message);
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('❌ Error booking pickup.');
  } finally {
    hideLoading();
  }
}
// ============= SEARCH LOGIC =============
function setupSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn) {
    searchBtn.removeEventListener('click', searchCenters);
    searchBtn.addEventListener('click', searchCenters);
  }
  if (searchInput) {
    searchInput.removeEventListener('keypress', handleSearchKey);
    searchInput.addEventListener('keypress', handleSearchKey);
  }
}

function handleSearchKey(e) {
  if (e.key === 'Enter') searchCenters();
}

async function searchCenters() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!query) {
    displayCenters(allCenters);
    populateCenterDropdown(allCenters);
    document.getElementById('centerInfo').innerHTML = '';
    return;
  }

  const filtered = allCenters.filter(c =>
    c.city.toLowerCase().includes(query) ||
    (c.pincode && c.pincode.includes(query)) ||
    c.acceptedItems.some(item => item.toLowerCase().includes(query)) ||
    c.name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    document.getElementById('centerInfo').innerHTML = `<p>❌ No centers found for "${query}".</p>`;
    if (markersLayer) markersLayer.clearLayers();
    return;
  }

  displayCenters(filtered);
  populateCenterDropdown(filtered);
  document.getElementById('centerInfo').innerHTML = `<p>✅ Found ${filtered.length} center(s) matching "${query}"</p>`;
}

// ============= 🌟 FIND NEAREST CENTERS (WITH CLICKABLE LIST) =============
function setupNearestButton() {
  const nearestBtn = document.getElementById('nearestBtn');
  if (nearestBtn) {
    nearestBtn.removeEventListener('click', findNearestCenters);
    nearestBtn.addEventListener('click', findNearestCenters);
  }
}

function findNearestCenters() {
  if (!navigator.geolocation) {
    alert('❌ Geolocation is not supported by your browser.');
    return;
  }

  if (!allCenters || allCenters.length === 0) {
    alert('⚠️ No centers available to find nearest. Please add centers via Admin panel.');
    return;
  }

  const btn = document.getElementById('nearestBtn');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Getting your location...';
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      if (userMarker && map) {
        map.removeLayer(userMarker);
      }

      const userIcon = L.divIcon({
        className: 'user-location-label',
        html: '📍 You',
        iconSize: [40, 20],
        iconAnchor: [20, 20],
      });
      userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('📍 <strong>You are here</strong>');

      const centersWithDistance = allCenters.map(center => {
        const dist = getDistance(userLat, userLng, center.latitude, center.longitude);
        return { ...center, distance: dist };
      });

      centersWithDistance.sort((a, b) => a.distance - b.distance);
      const nearest = centersWithDistance.slice(0, 5);

      displayCenters(nearest);
      populateCenterDropdown(nearest);

      let infoHtml = `<h3>📍 Nearest Centers (${nearest.length} closest)</h3>`;
      infoHtml += `<p style="font-size:14px; color:#555; margin-bottom:10px;">👆 Click any center name below to book instantly!</p>`;

      nearest.forEach((c, index) => {
        infoHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee; cursor:pointer; transition:0.2s;" 
               onclick="selectCenter('${c._id}')" 
               onmouseover="this.style.backgroundColor='#f0f4f8'" 
               onmouseout="this.style.backgroundColor='transparent'">
            <span>
              <strong>${index + 1}.</strong> 
              <span style="color:#0d2b3e; font-weight:700; text-decoration:underline;">${c.name}</span>
              <br/><span style="font-size:13px; color:#666;">${c.address}</span>
            </span>
            <span style="color:#f9a825; font-weight:bold; font-size:18px; white-space:nowrap; margin-left:15px;">
              ${c.distance.toFixed(2)} km ➜
            </span>
          </div>
        `;
      });

      infoHtml += `<p style="margin-top:12px; font-size:14px; color:#555;">✅ Sorted by distance. Click a center to book.</p>`;

      document.getElementById('centerInfo').innerHTML = infoHtml;

      if (nearest.length > 0 && map) {
        try {
          const group = L.featureGroup([userMarker, ...markersLayer.getLayers()]);
          map.fitBounds(group.getBounds().pad(0.3));
        } catch (e) {
          map.setView([userLat, userLng], 14);
        }
      } else if (map) {
        map.setView([userLat, userLng], 14);
      }

      btn.textContent = originalText;
      btn.disabled = false;
    },
    (error) => {
      console.error('Geolocation error:', error);
      let errorMsg = '❌ Unable to get your location. ';
      if (error.code === 1) errorMsg += 'Please allow location access in your browser.';
      else if (error.code === 2) errorMsg += 'Location unavailable.';
      else errorMsg += 'Please try again.';
      alert(errorMsg);

      btn.textContent = originalText;
      btn.disabled = false;
    }
  );
}

// ============= DISTANCE CALCULATOR =============
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============= MAKE FUNCTIONS GLOBAL =============
window.initMap = initMap;
window.loadCenters = loadCenters;
window.fetchCentersData = fetchCentersData;
window.selectCenter = selectCenter;
window.searchCenters = searchCenters;
window.findNearestCenters = findNearestCenters;
window.showCenterDetails = showCenterDetails;
window.populateCenterDropdown = populateCenterDropdown;
window.displayCenters = displayCenters;
window.getDistance = getDistance;
window.allCenters = allCenters;