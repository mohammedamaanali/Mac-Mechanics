<?php
/**
 * WrenchNear — Mechanics Finder API
 * File: mechanics.php
 *
 * Returns mechanics near a given lat/lng within a radius.
 * Uses a built-in demo dataset by default.
 * Uncomment the MySQL section to use a real database.
 *
 * URL: mechanics.php?lat=17.38&lng=78.46&radius=10&service=oil_change
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

/* ============================================================
   CONFIG — Toggle between Demo Data and MySQL
   ============================================================ */
define('USE_DATABASE', false); // Set to true to use MySQL

define('DB_HOST', 'localhost');
define('DB_NAME', 'wrenchar_db');
define('DB_USER', 'root');
define('DB_PASS', '');

/* ============================================================
   INPUT VALIDATION
   ============================================================ */
$lat    = isset($_GET['lat'])     ? floatval($_GET['lat'])     : null;
$lng    = isset($_GET['lng'])     ? floatval($_GET['lng'])     : null;
$radius = isset($_GET['radius'])  ? floatval($_GET['radius'])  : 10;
$service = isset($_GET['service']) ? trim($_GET['service'])   : '';

if ($lat === null || $lng === null || $lat == 0 || $lng == 0) {
    echo json_encode(['error' => 'Valid latitude and longitude are required.']);
    exit;
}

if ($radius < 1 || $radius > 100) $radius = 10;

/* ============================================================
   HAVERSINE DISTANCE FUNCTION
   Returns distance in km between two lat/lng points.
   ============================================================ */
function haversine($lat1, $lng1, $lat2, $lng2) {
    $R = 6371; // Earth radius in km
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLng/2) * sin($dLng/2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return round($R * $c, 1);
}

/* ============================================================
   SERVICE TAG NORMALIZER
   ============================================================ */
function normalizeService($tag) {
    $map = [
        'oil_change'    => 'Oil Change',
        'brake_repair'  => 'Brake Repair',
        'engine_repair' => 'Engine Repair',
        'tire_service'  => 'Tire Service',
        'transmission'  => 'Transmission',
        'electrical'    => 'Electrical',
    ];
    return $map[$tag] ?? '';
}

/* ============================================================
   FETCH FROM DATABASE (MySQL)
   ============================================================ */
function fetchFromDatabase($lat, $lng, $radius, $service) {
    try {
        $dsn  = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo  = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        // Build query — pull all mechanics, filter by distance in PHP (haversine in SQL too)
        $sql  = "SELECT * FROM mechanics WHERE status = 'active'";
        $params = [];

        // Optional service filter (assumes JSON services column or a tag column)
        if ($service) {
            $svcLabel = normalizeService($service);
            if ($svcLabel) {
                $sql .= " AND FIND_IN_SET(:service, services) > 0";
                $params[':service'] = $svcLabel;
            }
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Filter by haversine distance
        $mechanics = [];
        foreach ($rows as $row) {
            $dist = haversine($lat, $lng, $row['lat'], $row['lng']);
            if ($dist <= $radius) {
                $row['distance_km'] = $dist;
                $row['services']    = explode(',', $row['services']);
                $row['open']        = isOpenNow($row['hours'] ?? '');
                $mechanics[] = $row;
            }
        }

        usort($mechanics, fn($a, $b) => $a['distance_km'] <=> $b['distance_km']);
        return $mechanics;

    } catch (PDOException $e) {
        return ['__db_error' => $e->getMessage()];
    }
}

/* ============================================================
   OPEN STATUS HELPER
   ============================================================ */
function isOpenNow($hoursString) {
    $hour = (int)date('G'); // 0-23
    $day  = date('D');
    $isWeekend = in_array($day, ['Sat', 'Sun']);

    if (strpos($hoursString, '24/7') !== false) return true;

    // Crude heuristic: Mon-Fri shops closed on weekends, general shop hours 8AM-8PM
    if ($isWeekend && strpos($hoursString, 'Mon-Fri') !== false) return false;
    if ($hour >= 8 && $hour < 20) return true;
    return false;
}

/* ============================================================
   DEMO DATA (used when USE_DATABASE = false)
   ============================================================ */
function getDemoMechanics() {
    return [
        [
            'id' => 1, 'name' => 'AutoPro Garage',
            'specialty' => 'Engine & Transmission',
            'lat' => 0, 'lng' => 0, // Offset applied dynamically
            'lat_offset' => 0.045, 'lng_offset' => 0.032,
            'phone' => '+91-98765-43210',
            'address' => 'Shop 12, Industrial Area, Sector 1',
            'hours' => 'Mon-Sat: 8AM-8PM',
            'price_range' => '₹₹',
            'rating' => 4.7, 'reviews' => 184,
            'services' => ['Oil Change', 'Engine Repair', 'Transmission'],
        ],
        [
            'id' => 2, 'name' => 'QuickFix Motors',
            'specialty' => 'Oil Change & Brakes',
            'lat_offset' => -0.032, 'lng_offset' => 0.055,
            'phone' => '+91-87654-32109',
            'address' => 'Plot 7B, Main Road, Near City Mall',
            'hours' => 'Mon-Sun: 7AM-9PM',
            'price_range' => '₹',
            'rating' => 4.5, 'reviews' => 312,
            'services' => ['Oil Change', 'Brake Repair', 'Battery Replacement'],
        ],
        [
            'id' => 3, 'name' => 'City Mechanics',
            'specialty' => 'Full Service Auto',
            'lat_offset' => 0.068, 'lng_offset' => -0.028,
            'phone' => '+91-76543-21098',
            'address' => '3rd Lane, Auto Nagar, Block C',
            'hours' => 'Mon-Fri: 9AM-6PM',
            'price_range' => '₹₹₹',
            'rating' => 4.9, 'reviews' => 97,
            'services' => ['Full Service', 'AC Repair', 'Suspension', 'Alignment'],
        ],
        [
            'id' => 4, 'name' => 'FastTrack Auto',
            'specialty' => 'Tire & Wheel Specialist',
            'lat_offset' => -0.061, 'lng_offset' => -0.044,
            'phone' => '+91-65432-10987',
            'address' => 'Near Highway Petrol Bunk, West End',
            'hours' => 'Mon-Sat: 8AM-7PM',
            'price_range' => '₹',
            'rating' => 4.3, 'reviews' => 256,
            'services' => ['Tire Fitting', 'Wheel Alignment', 'Balancing', 'Tire Service'],
        ],
        [
            'id' => 5, 'name' => 'RoadReady Workshop',
            'specialty' => 'Electrical & Diagnostics',
            'lat_offset' => 0.021, 'lng_offset' => -0.071,
            'phone' => '+91-54321-09876',
            'address' => 'Shop 5, Tech Park Road, Opp Bus Stand',
            'hours' => 'Open 24/7',
            'price_range' => '₹₹',
            'rating' => 4.6, 'reviews' => 143,
            'services' => ['Electrical', 'Diagnostics', 'ECU Repair', 'Wiring'],
        ],
        [
            'id' => 6, 'name' => 'TurboTech Garage',
            'specialty' => 'Performance Tuning',
            'lat_offset' => -0.052, 'lng_offset' => 0.067,
            'phone' => '+91-43210-98765',
            'address' => 'Unit 22, Speed Zone, Ring Road',
            'hours' => 'Mon-Sun: 6AM-10PM',
            'price_range' => '₹₹₹',
            'rating' => 4.8, 'reviews' => 76,
            'services' => ['Performance Tuning', 'Exhaust Upgrade', 'Turbo Install', 'Engine Repair'],
        ],
        [
            'id' => 7, 'name' => 'StreetStar Auto',
            'specialty' => 'Brake Specialist',
            'lat_offset' => 0.037, 'lng_offset' => 0.081,
            'phone' => '+91-32109-87654',
            'address' => 'Corner Shop, Market Street, Near Flyover',
            'hours' => 'Mon-Sat: 9AM-8PM',
            'price_range' => '₹',
            'rating' => 4.4, 'reviews' => 201,
            'services' => ['Brake Repair', 'Brake Pads', 'Rotors', 'Drums'],
        ],
        [
            'id' => 8, 'name' => 'PrimeAuto Care',
            'specialty' => 'AC & Heating',
            'lat_offset' => -0.079, 'lng_offset' => -0.015,
            'phone' => '+91-21098-76543',
            'address' => 'Shop 9, Comfort Zone Complex, East Side',
            'hours' => 'Mon-Fri: 8AM-6PM',
            'price_range' => '₹₹',
            'rating' => 4.5, 'reviews' => 119,
            'services' => ['AC Repair', 'Heating', 'Blower Motor', 'Refrigerant Refill'],
        ],
        [
            'id' => 9, 'name' => 'MasterGrip Motors',
            'specialty' => 'Suspension & Alignment',
            'lat_offset' => 0.055, 'lng_offset' => -0.058,
            'phone' => '+91-10987-65432',
            'address' => 'Plot 18, Wheel Street, Industrial Zone',
            'hours' => 'Mon-Sun: 7AM-9PM',
            'price_range' => '₹₹',
            'rating' => 4.7, 'reviews' => 162,
            'services' => ['Suspension', 'Wheel Alignment', 'Shocks', 'Struts'],
        ],
        [
            'id' => 10, 'name' => 'SwiftLane Garage',
            'specialty' => 'Body & Paint',
            'lat_offset' => -0.041, 'lng_offset' => -0.077,
            'phone' => '+91-09876-54321',
            'address' => 'Colour House, Paint Lane, South Block',
            'hours' => 'Mon-Sat: 10AM-8PM',
            'price_range' => '₹₹₹',
            'rating' => 4.6, 'reviews' => 89,
            'services' => ['Denting', 'Painting', 'Body Repair', 'Polish'],
        ],
        [
            'id' => 11, 'name' => 'Rapid Repair Hub',
            'specialty' => 'Multi-Brand Service',
            'lat_offset' => 0.091, 'lng_offset' => 0.043,
            'phone' => '+91-98001-11222',
            'address' => 'NH-44 Service Road, Milestone 5',
            'hours' => 'Open 24/7',
            'price_range' => '₹₹',
            'rating' => 4.2, 'reviews' => 338,
            'services' => ['Oil Change', 'Brake Repair', 'Tire Service', 'Electrical'],
        ],
        [
            'id' => 12, 'name' => 'Elite Auto Solutions',
            'specialty' => 'Luxury & Import Cars',
            'lat_offset' => -0.088, 'lng_offset' => 0.029,
            'phone' => '+91-99887-65432',
            'address' => 'Premium Zone, Car Care Colony, West',
            'hours' => 'Mon-Sat: 9AM-7PM',
            'price_range' => '₹₹₹',
            'rating' => 4.9, 'reviews' => 54,
            'services' => ['Diagnostics', 'Engine Repair', 'Transmission', 'Full Service'],
        ],
    ];
}

/* ============================================================
   MAIN LOGIC
   ============================================================ */
if (USE_DATABASE) {
    $result = fetchFromDatabase($lat, $lng, $radius, $service);
    if (isset($result['__db_error'])) {
        echo json_encode(['error' => 'Database error: ' . $result['__db_error']]);
        exit;
    }
    $mechanics = $result;
} else {
    // Use demo data with dynamic offsets from user's location
    $allMechanics = getDemoMechanics();
    $mechanics = [];
    $svcFilter  = normalizeService($service);

    foreach ($allMechanics as $mech) {
        $mechLat = $lat + $mech['lat_offset'];
        $mechLng = $lng + $mech['lng_offset'];
        $dist    = haversine($lat, $lng, $mechLat, $mechLng);

        if ($dist > $radius) continue;

        // Filter by service
        if ($svcFilter && !in_array($svcFilter, $mech['services'])) continue;

        $mech['lat']         = round($mechLat, 6);
        $mech['lng']         = round($mechLng, 6);
        $mech['distance_km'] = $dist;
        $mech['open']        = isOpenNow($mech['hours']);
        unset($mech['lat_offset'], $mech['lng_offset']);

        $mechanics[] = $mech;
    }

    // Sort by distance ascending
    usort($mechanics, fn($a, $b) => $a['distance_km'] <=> $b['distance_km']);
}

/* ============================================================
   RESPONSE
   ============================================================ */
echo json_encode([
    'success'   => true,
    'user_lat'  => $lat,
    'user_lng'  => $lng,
    'radius_km' => $radius,
    'count'     => count($mechanics),
    'mechanics' => $mechanics,
], JSON_PRETTY_PRINT);
?>
