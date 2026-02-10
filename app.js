/* =============================================
   WrenchNear — Frontend Application Logic
   ============================================= */

let map = null;
let userMarker = null;
let mechanicMarkers = [];
let allMechanics = [];
let userLat = null;
let userLng = null;

/* ---- INIT MAP ---- */
function initMap(lat, lng) {
  if (map) {
    map.setView([lat, lng], 13);
    return;
  }
  map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);
}

/* ---- USER LOCATION MARKER ---- */
function placeUserMarker(lat, lng) {
  if (userMarker) userMarker.remove();
  const icon = L.divIcon({
    html: `<div style="
      width:20px;height:20px;background:#f59e0b;border-radius:50%;
      border:3px solid #fff;box-shadow:0 0 12px rgba(245,158,11,0.8);
    "></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], className: ''
  });
  userMarker = L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup('<strong style="color:#f59e0b">📍 Your Location</strong>');
}

/* ---- MECHANIC MAP MARKER ---- */
function placeMechanicMarkers(mechanics) {
  mechanicMarkers.forEach(m => m.remove());
  mechanicMarkers = [];

  mechanics.forEach((mech, i) => {
    const icon = L.divIcon({
      html: `<div style="
        background:#111;border:2px solid #f59e0b;
        padding:4px 8px;font-family:'Rajdhani',sans-serif;
        font-size:11px;font-weight:700;color:#f59e0b;
        white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,0.5);
        letter-spacing:0.05em;
      ">⚙ ${mech.name.split(' ')[0]}</div>`,
      className: '', iconAnchor: [0, 0]
    });

    const marker = L.marker([mech.lat, mech.lng], { icon })
      .addTo(map)
      .on('click', () => openModal(mech));

    marker.bindPopup(`
      <div style="font-family:'Rajdhani',sans-serif;min-width:160px">
        <strong style="font-size:1rem;color:#f59e0b">${mech.name}</strong><br/>
        <span style="font-size:0.8rem;color:#a3a3a3">${mech.specialty}</span><br/>
        <span style="font-size:0.78rem">⭐ ${mech.rating} &nbsp; 📍 ${mech.distance_km} km</span>
      </div>
    `);

    mechanicMarkers.push(marker);
  });
}

/* ---- GET USER GPS LOCATION ---- */
function triggerSearch() {
  showLoading();
  setStatus('Requesting GPS access...');
  showStatus();

  if (!navigator.geolocation) {
    hideLoading();
    setStatus('❌ Geolocation not supported. Please search by address.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      setStatus(`✅ Located you at (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`);
      fetchMechanics(userLat, userLng);
    },
    (err) => {
      hideLoading();
      setStatus('❌ Could not get GPS. Try searching by address below.');
      console.warn(err);
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

/* ---- SEARCH BY ADDRESS (Geocode via Nominatim) ---- */
async function searchByAddress() {
  const query = document.getElementById('manual-search').value.trim();
  if (!query) {
    triggerSearch();
    return;
  }

  showLoading();
  setStatus(`🔍 Searching for "${query}"...`);
  showStatus();

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();

    if (!data.length) {
      hideLoading();
      setStatus('❌ Address not found. Try a different search.');
      return;
    }

    userLat = parseFloat(data[0].lat);
    userLng = parseFloat(data[0].lon);
    setStatus(`✅ Found: ${data[0].display_name.substring(0, 60)}...`);
    fetchMechanics(userLat, userLng);

  } catch (e) {
    hideLoading();
    setStatus('❌ Geocoding failed. Please check your connection.');
  }
}

/* ---- FETCH MECHANICS FROM PHP API ---- */
async function fetchMechanics(lat, lng) {
  const radius = document.getElementById('radius-select').value;
  const service = document.getElementById('service-select').value;

  try {
    const params = new URLSearchParams({
      lat, lng, radius, service
    });

    const res = await fetch(`mechanics.php?${params}`);
    const data = await res.json();

    if (data.error) {
      hideLoading();
      setStatus('❌ ' + data.error);
      return;
    }

    allMechanics = data.mechanics;
    renderResults(lat, lng, allMechanics);

  } catch (e) {
    hideLoading();
    // Fallback to demo data when PHP not available
    const demo = generateDemoMechanics(lat, lng);
    allMechanics = demo;
    renderResults(lat, lng, demo);
    setStatus('ℹ Demo mode — PHP backend not detected. Showing sample data.');
  }
}

/* ---- DEMO DATA (fallback when PHP not running) ---- */
function generateDemoMechanics(lat, lng) {
  const names = [
    ['AutoPro Garage', 'Engine & Transmission'], ['QuickFix Motors', 'Oil Change & Brakes'],
    ['City Mechanics', 'Full Service Auto'], ['FastTrack Auto', 'Tire & Wheel Specialist'],
    ['RoadReady Workshop', 'Electrical & Diagnostics'], ['TurboTech Garage', 'Performance Tuning'],
    ['StreetStar Auto', 'Brake Specialist'], ['PrimeAuto Care', 'AC & Heating'],
    ['MasterGrip Motors', 'Suspension & Alignment'], ['SwiftLane Garage', 'Body & Paint']
  ];
  const phones = ['+91-98765-43210','+91-87654-32109','+91-76543-21098','+91-65432-10987',
    '+91-54321-09876','+91-43210-98765','+91-32109-87654','+91-21098-76543',
    '+91-10987-65432','+91-09876-54321'];
  const hours = ['Mon-Sat: 8AM-8PM', 'Mon-Sun: 7AM-9PM', 'Mon-Fri: 9AM-6PM', 'Mon-Sat: 8AM-7PM',
    'Open 24/7', 'Mon-Sun: 6AM-10PM', 'Mon-Sat: 9AM-8PM', 'Mon-Fri: 8AM-6PM',
    'Mon-Sun: 7AM-9PM', 'Mon-Sat: 10AM-8PM'];
  const priceRanges = ['₹', '₹₹', '₹', '₹₹₹', '₹₹', '₹₹₹', '₹', '₹₹', '₹₹', '₹₹₹'];
  const allServices = [
    ['Oil Change','Brake Repair','Engine Repair'],
    ['Oil Change','Tire Service','Battery'],
    ['Full Service','AC Repair','Suspension'],
    ['Tire Fitting','Wheel Alignment','Balancing'],
    ['Diagnostics','Electrical','ECU Repair'],
    ['Performance Tuning','Exhaust','Turbo'],
    ['Brake Pads','Rotors','Drums'],
    ['AC Repair','Heating','Blower Motor'],
    ['Suspension','Alignment','Shocks'],
    ['Denting','Painting','Body Repair']
  ];
  const isOpen = [true, true, false, true, true, false, true, true, false, true];

  return names.map(([name, spec], i) => {
    const dlat = (Math.random() - 0.5) * 0.18;
    const dlng = (Math.random() - 0.5) * 0.18;
    const dist = +(Math.sqrt(dlat*dlat + dlng*dlng) * 111).toFixed(1);
    return {
      id: i + 1, name, specialty: spec,
      lat: lat + dlat, lng: lng + dlng,
      distance_km: dist,
      rating: (3.8 + Math.random() * 1.2).toFixed(1),
      reviews: 20 + Math.floor(Math.random() * 200),
      phone: phones[i],
      address: `Shop ${10 + i*3}, Area Road, Sector ${i + 1}`,
      hours: hours[i], price_range: priceRanges[i],
      services: allServices[i], open: isOpen[i]
    };
  });
}

/* ---- RENDER RESULTS ---- */
function renderResults(lat, lng, mechanics) {
  hideLoading();
  showSection('results-section');

  document.getElementById('result-count-badge').textContent =
    `${mechanics.length} found`;

  initMap(lat, lng);
  placeUserMarker(lat, lng);
  placeMechanicMarkers(mechanics);

  renderCards(mechanics);

  // Auto-fit map bounds
  if (mechanics.length) {
    const bounds = [[lat, lng], ...mechanics.map(m => [m.lat, m.lng])];
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

/* ---- RENDER CARDS ---- */
function renderCards(mechanics) {
  const list = document.getElementById('mechanics-list');
  list.innerHTML = '';

  if (!mechanics.length) {
    list.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-3)">
      No mechanics found in this area. Try expanding the radius.
    </div>`;
    return;
  }

  mechanics.forEach((mech, idx) => {
    const initials = mech.name.split(' ').slice(0, 2).map(w => w[0]).join('');
    const stars = '★'.repeat(Math.round(mech.rating)) + '☆'.repeat(5 - Math.round(mech.rating));
    const card = document.createElement('div');
    card.className = 'mechanic-card';
    card.dataset.id = mech.id;
    card.innerHTML = `
      <div class="card-avatar">${initials}</div>
      <div class="card-info">
        <div class="card-name">${mech.name}</div>
        <div class="card-specialty">${mech.specialty}</div>
        <div class="card-address">📍 ${mech.address}</div>
        <div class="card-meta">
          ${mech.services.slice(0, 3).map(s => `<span class="meta-tag">${s}</span>`).join('')}
        </div>
      </div>
      <div class="card-right">
        <div class="card-dist">${mech.distance_km} km</div>
        <div class="card-rating">
          <span class="star">★</span> ${mech.rating}
          <span style="font-size:0.7rem;color:var(--text-3)">(${mech.reviews})</span>
        </div>
        <div class="open-tag ${mech.open ? 'open' : 'closed'}">
          ${mech.open ? '● OPEN' : '● CLOSED'}
        </div>
        <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px">${mech.price_range}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      openModal(mech);
      highlightCard(mech.id);
      if (map && mech.lat && mech.lng) {
        map.setView([mech.lat, mech.lng], 15);
        mechanicMarkers[idx]?.openPopup();
      }
    });
    list.appendChild(card);
  });
}

/* ---- HIGHLIGHT CARD ---- */
function highlightCard(id) {
  document.querySelectorAll('.mechanic-card').forEach(c => {
    c.classList.toggle('highlighted', c.dataset.id == id);
  });
}

/* ---- SORT RESULTS ---- */
function sortResults(by) {
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  const sorted = [...allMechanics].sort((a, b) => {
    if (by === 'distance') return a.distance_km - b.distance_km;
    if (by === 'rating')   return b.rating - a.rating;
    if (by === 'price') {
      const rank = s => (s.match(/₹/g)||[]).length;
      return rank(a.price_range) - rank(b.price_range);
    }
    return 0;
  });

  renderCards(sorted);
}

/* ---- MODAL ---- */
function openModal(mech) {
  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <div class="modal-header">
      <h2>${mech.name}</h2>
      <p>${mech.specialty}</p>
    </div>
    <div class="modal-body">
      <div class="modal-info-grid">
        <div class="modal-info-item">
          <label>Distance</label>
          <span>${mech.distance_km} km away</span>
        </div>
        <div class="modal-info-item">
          <label>Rating</label>
          <span>★ ${mech.rating} <small style="color:var(--text-3)">(${mech.reviews} reviews)</small></span>
        </div>
        <div class="modal-info-item">
          <label>Hours</label>
          <span style="font-size:0.88rem">${mech.hours}</span>
        </div>
        <div class="modal-info-item">
          <label>Price Range</label>
          <span>${mech.price_range}</span>
        </div>
        <div class="modal-info-item" style="grid-column:1/-1">
          <label>Address</label>
          <span>${mech.address}</span>
        </div>
        <div class="modal-info-item" style="grid-column:1/-1">
          <label>Phone</label>
          <span>${mech.phone}</span>
        </div>
        <div class="modal-info-item">
          <label>Status</label>
          <span class="open-tag ${mech.open ? 'open' : 'closed'}">
            ${mech.open ? '● Currently Open' : '● Currently Closed'}
          </span>
        </div>
      </div>

      <div class="modal-services">
        <h4>Services Offered</h4>
        <div class="service-chips">
          ${mech.services.map(s => `<span class="chip">${s}</span>`).join('')}
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-call" onclick="callMechanic('${mech.phone}')">
          📞 Call Now
        </button>
        <a class="btn-directions"
           href="https://www.google.com/maps/dir/?api=1&destination=${mech.lat},${mech.lng}"
           target="_blank">
          🗺 Get Directions
        </a>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function callMechanic(phone) {
  window.location.href = `tel:${phone.replace(/[^+0-9]/g, '')}`;
}

/* ---- CONTACT FORM ---- */
function submitContact(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = '✅ Submitted! We will contact you soon.';
  btn.style.background = '#22c55e';
  btn.disabled = true;
  setTimeout(() => {
    e.target.reset();
    btn.textContent = 'Submit Your Shop';
    btn.style.background = '';
    btn.disabled = false;
  }, 4000);
}

/* ---- UTILS ---- */
function showLoading() { document.getElementById('loading-overlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }
function showStatus()  { document.getElementById('location-status').classList.remove('hidden'); }
function setStatus(t)  { document.getElementById('status-text').textContent = t; }
function showSection(id) { document.getElementById(id).classList.remove('hidden'); }

/* ---- KEYBOARD SEARCH ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('manual-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchByAddress();
  });
});

/* ---- KEYBOARD ESC TO CLOSE MODAL ---- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
