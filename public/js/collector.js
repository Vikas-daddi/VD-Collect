const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
  checkCollectorAuth();
  loadRoutes();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
});

function checkCollectorAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || user.role !== 'collector') {
    alert('Access denied. Please login as a collector.');
    window.location.href = '/';
  }
}

async function loadRoutes() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('routeList');

  try {
    const res = await fetch(`${API_URL}/bookings/my-assignments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load routes');

    const bookings = await res.json();
    
    if (bookings.length === 0) {
      container.innerHTML = '<p style="color:#777; text-align:center;">You have no assigned routes today. Enjoy your day! 🌟</p>';
      return;
    }

    container.innerHTML = bookings.map(b => {
      const isCompleted = b.status === 'completed';
      
      let itemsText = 'N/A';
      if (b.items && Array.isArray(b.items) && b.items.length > 0) {
        itemsText = b.items.map(item => `${item.name || 'Unknown Item'} (x${item.quantity || 1})`).join(', ');
      }

      return `
        <div class="route-card ${isCompleted ? 'completed' : ''}">
          <div class="route-header">
            <h3>👤 ${b.user?.name || 'Unknown Citizen'}</h3>
            <span class="status ${isCompleted ? 'completed' : ''}">${b.status}</span>
          </div>
          <p class="detail">
            <strong>📍 Address:</strong> ${b.pickupAddress} 
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.pickupAddress)}" target="_blank" style="margin-left:10px; background:#e3f2fd; color:#1976d2; padding:3px 8px; border-radius:12px; text-decoration:none; font-size:12px; font-weight:bold;">
              🗺️ Get Directions
            </a>
          </p>
          <p class="detail"><strong>📞 Phone:</strong> ${b.user?.phone || 'No phone'}</p>
          <p class="detail"><strong>🏢 Drop-off:</strong> ${b.center?.name || 'Unknown Center'}</p>
          <p class="detail"><strong>📦 Items:</strong> ${itemsText}</p>
          
          <button 
            class="btn-complete" 
            onclick="markCollected('${b._id}')" 
            ${isCompleted ? 'disabled' : ''}>
            ${isCompleted ? '✅ Collected' : '✅ Mark as Collected'}
          </button>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = '<p style="color:red;">❌ Failed to load routes.</p>';
    console.error(error);
  }
}

window.markCollected = async function(bookingId) {
  if (!confirm('Are you sure you want to mark this pickup as collected?')) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'completed' })
    });

    if (res.ok) {
      alert('🎉 Awesome job! The items have been marked as collected.');
      loadRoutes();
    } else {
      const err = await res.json();
      alert('❌ Failed to update status: ' + err.message);
    }
  } catch (error) {
    alert('❌ Error updating status.');
  }
};
