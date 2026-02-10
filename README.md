# ⚙ WrenchNear — Mechanic Finder Website

A full-stack mechanic finder with GPS-powered search, interactive map, and mechanic detail cards.

---

## 📁 Project Structure

```
mechanic-finder/
├── index.html        ← Main UI (HTML)
├── style.css         ← Industrial dark theme (CSS)
├── app.js            ← Map, geolocation, search logic (JS)
├── mechanics.php     ← Backend API — returns nearby mechanics (PHP)
├── database.sql      ← MySQL schema + sample data (optional)
└── README.md         ← This file
```

---

## 🚀 Quick Setup

### Option 1 — Open Directly (Demo Mode)
Just open `index.html` in a browser.
> The app auto-detects when PHP is unavailable and falls back to demo data with 12 sample mechanics.

### Option 2 — Run with PHP (Recommended)
1. Copy all files to your web server root (Apache/Nginx/XAMPP/WAMP).
2. Visit `http://localhost/mechanic-finder/`
3. The PHP backend at `mechanics.php` serves real data.

### Option 3 — Use MySQL Database
1. Import `database.sql` into MySQL:
   ```bash
   mysql -u root -p < database.sql
   ```
2. Open `mechanics.php` and edit:
   ```php
   define('USE_DATABASE', true);    // ← change to true
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_user');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'wrenchar_db');
   ```
3. Add new mechanics via SQL INSERT or build an admin panel.

---

## 🌐 API Reference

### `GET mechanics.php`

| Parameter | Type   | Required | Description                                  |
|-----------|--------|----------|----------------------------------------------|
| `lat`     | float  | ✅ Yes   | User's latitude                              |
| `lng`     | float  | ✅ Yes   | User's longitude                             |
| `radius`  | number | No       | Search radius in km (default: 10, max: 100)  |
| `service` | string | No       | Filter by service type (see below)           |

**Service values:** `oil_change`, `brake_repair`, `engine_repair`, `tire_service`, `transmission`, `electrical`

**Example:**
```
mechanics.php?lat=17.38&lng=78.46&radius=15&service=brake_repair
```

**Response:**
```json
{
  "success": true,
  "user_lat": 17.38,
  "user_lng": 78.46,
  "radius_km": 15,
  "count": 8,
  "mechanics": [
    {
      "id": 1,
      "name": "AutoPro Garage",
      "specialty": "Engine & Transmission",
      "lat": 17.425,
      "lng": 78.512,
      "distance_km": 5.2,
      "phone": "+91-98765-43210",
      "address": "Shop 12, Industrial Area",
      "hours": "Mon-Sat: 8AM-8PM",
      "price_range": "₹₹",
      "rating": 4.7,
      "reviews": 184,
      "services": ["Oil Change", "Engine Repair", "Transmission"],
      "open": true
    }
  ]
}
```

---

## ✨ Features

- 📍 **One-click GPS location** via browser Geolocation API
- 🗺 **Interactive dark map** via Leaflet.js + OpenStreetMap (no API key needed)
- 🔍 **Address search** via OpenStreetMap Nominatim geocoder
- 📏 **Haversine distance** calculated server-side in PHP
- 🔧 **Service filter** (Oil Change, Brakes, Engine, etc.)
- ↕ **Sort by** Distance / Rating / Price
- 📞 **Click to Call** from mechanic detail modal
- 🗺 **Get Directions** link to Google Maps
- 📋 **Shop registration form** for mechanics to join
- 🌑 Industrial dark theme with amber accents
- 📱 Fully responsive

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3 (custom properties), Vanilla JS |
| Map        | Leaflet.js + OpenStreetMap (free)   |
| Geocoding  | Nominatim API (free, no key needed) |
| Backend    | PHP 8+ (PDO for MySQL)              |
| Database   | MySQL 5.7+ / MariaDB (optional)     |

---

## 📸 Pages

| Section          | Description                             |
|------------------|-----------------------------------------|
| Hero             | Location CTA + stats                   |
| Search Bar       | GPS, address, radius, service filters  |
| Results (Map)    | Leaflet.js dark map with mechanic pins |
| Results (List)   | Scrollable mechanic cards              |
| How It Works     | 3-step guide                           |
| Register Shop    | Mechanic sign-up form                  |

---

## 🧩 Extending

### Add a mechanic
```sql
INSERT INTO mechanics (name, specialty, lat, lng, phone, address, hours, price_range, rating, reviews, services)
VALUES ('Bob Workshop', 'Engine Repair', 17.42, 78.49, '+91-9876543210', '12 Main St', 'Mon-Sat: 9AM-6PM', '₹₹', 4.5, 0, 'Oil Change,Engine Repair');
```

### Add new service filters
1. Add option to `<select id="service-select">` in `index.html`
2. Add mapping in `normalizeService()` in `mechanics.php`

---

> Built with ⚙ WrenchNear | © 2025
