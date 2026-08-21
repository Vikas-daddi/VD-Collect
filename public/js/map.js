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

// ============= INITIALIZE MAP =============
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  map = L.map('map').setView([28.6139, 77.2090], 5); // Default: Center of India

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  markersLayer = L.featureGroup().addTo(map);

  setupSearch();
  setupNearestButton();
  setupBookingForm();

  // If there's a pre-selected waste type, we should automatically trigger find nearest
  if (sessionStorage.getItem('preferredWasteType')) {
    // Wait slightly for centers to load before finding nearest
    setTimeout(() => {
      findNearestCenters();
    }, 500);
  }
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

  const wasteTypeDisplay = document.getElementById('wasteTypeDisplay');
  if (wasteTypeDisplay) {
    const preferred = sessionStorage.getItem('preferredWasteType') || '';
    wasteTypeDisplay.value = preferred;
    if (!preferred) {
      wasteTypeDisplay.removeAttribute('readonly');
      wasteTypeDisplay.style.cursor = 'text';
    }
  }

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

  const wasteCategory = document.getElementById('wasteTypeDisplay').value;
  const wasteQty = document.getElementById('wasteQuantity').value;
  const imageInput = document.getElementById('wasteImage');
  let base64Image = null;

  if (imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const bookingData = {
    centerId: centerId,
    pickupAddress: document.getElementById('pickupAddress').value,
    pickupDate: pickupDate,
    items: [{ name: wasteCategory, quantity: parseInt(wasteQty, 10) }],
    image: base64Image
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
      sessionStorage.setItem('success_items', `${wasteCategory} (x${wasteQty})`);
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
  const wasteType = sessionStorage.getItem('preferredWasteType');
  let baseCenters = allCenters;
  
  if (wasteType) {
    baseCenters = allCenters.filter(c => c.acceptedItems.includes(wasteType));
  }

  if (!query) {
    displayCenters(baseCenters);
    populateCenterDropdown(baseCenters);
    if (wasteType) {
      document.getElementById('centerInfo').innerHTML = `<div style="background-color: #e3f2fd; color: #0d47a1; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; text-align: center;"><strong>Filtering for:</strong> ${wasteType} <button onclick="sessionStorage.removeItem('preferredWasteType'); window.location.reload();" style="margin-left: 10px; background: none; border: none; color: red; text-decoration: underline; cursor: pointer;">Clear Filter</button></div>`;
    } else {
      document.getElementById('centerInfo').innerHTML = '';
    }
    return;
  }

  const filtered = baseCenters.filter(c =>
    c.city.toLowerCase().includes(query) ||
    (c.pincode && c.pincode.includes(query)) ||
    c.acceptedItems.some(item => item.toLowerCase().includes(query)) ||
    c.name.toLowerCase().includes(query)
  );

  let filterBanner = wasteType ? `<div style="background-color: #e3f2fd; color: #0d47a1; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; text-align: center;"><strong>Filtering for:</strong> ${wasteType} <button onclick="sessionStorage.removeItem('preferredWasteType'); window.location.reload();" style="margin-left: 10px; background: none; border: none; color: red; text-decoration: underline; cursor: pointer;">Clear Filter</button></div>` : '';

  if (filtered.length === 0) {
    document.getElementById('centerInfo').innerHTML = `${filterBanner}<p>❌ No centers found for "${query}".</p>`;
    if (markersLayer) markersLayer.clearLayers();
    return;
  }

  displayCenters(filtered);
  populateCenterDropdown(filtered);
  document.getElementById('centerInfo').innerHTML = `${filterBanner}<p>✅ Found ${filtered.length} center(s) matching "${query}"</p>`;
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

      const wasteType = sessionStorage.getItem('preferredWasteType');
      let centersToSearch = allCenters;

      let filterBanner = '';
      if (wasteType) {
        centersToSearch = allCenters.filter(c => c.acceptedItems.includes(wasteType));
        filterBanner = `<div style="background-color: #e3f2fd; color: #0d47a1; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; text-align: center;"><strong>Filtering for:</strong> ${wasteType} <button onclick="sessionStorage.removeItem('preferredWasteType'); window.location.reload();" style="margin-left: 10px; background: none; border: none; color: red; text-decoration: underline; cursor: pointer;">Clear Filter</button></div>`;
      }

      if (centersToSearch.length === 0) {
        document.getElementById('centerInfo').innerHTML = `${filterBanner}<p>❌ No centers found accepting ${wasteType} near you.</p>`;
        btn.textContent = originalText;
        btn.disabled = false;
        return;
      }

      const centersWithDistance = centersToSearch.map(center => {
        const dist = getDistance(userLat, userLng, center.latitude, center.longitude);
        return { ...center, distance: dist };
      });

      centersWithDistance.sort((a, b) => a.distance - b.distance);
      const nearest = centersWithDistance.slice(0, 5);

      displayCenters(nearest);
      populateCenterDropdown(nearest);

      let infoHtml = `${filterBanner}<h3>📍 Nearest Centers (${nearest.length} closest)</h3>`;
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

// ============= REQUEST CENTER LOGIC =============
document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openRequestModalBtn');
  const closeModalBtn = document.getElementById('closeRequestModalBtn');
  const modal = document.getElementById('requestModal');
  const submitBtn = document.getElementById('submitRequestBtn');
  const locationInput = document.getElementById('requestLocation');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      if (!localStorage.getItem('token')) {
        alert('Please login or register to request a center.');
        window.location.href = '/login';
        return;
      }
      modal.style.display = 'flex';
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      locationInput.value = '';
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const location = locationInput.value.trim();
      if (!location) {
        alert('Please enter a city or neighborhood.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ location })
        });

        if (response.ok) {
          alert('Request submitted successfully! We will look into adding a center in your area.');
          modal.style.display = 'none';
          locationInput.value = '';
        } else {
          const error = await response.json();
          alert('Failed to submit request: ' + error.message);
        }
      } catch (err) {
        alert('Error submitting request.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }
    });
  }
});