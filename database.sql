-- ============================================================
-- WrenchNear — MySQL Database Schema
-- Run this once to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS wrenchar_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE wrenchar_db;

-- MECHANICS TABLE
CREATE TABLE IF NOT EXISTS mechanics (
  id           INT         AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  specialty    VARCHAR(120) NOT NULL,
  lat          DECIMAL(10, 7) NOT NULL,
  lng          DECIMAL(10, 7) NOT NULL,
  phone        VARCHAR(20)  NOT NULL,
  address      TEXT         NOT NULL,
  hours        VARCHAR(80)  NOT NULL DEFAULT 'Mon-Sat: 9AM-6PM',
  price_range  VARCHAR(5)   NOT NULL DEFAULT '₹₹',
  rating       DECIMAL(2,1) NOT NULL DEFAULT 4.0,
  reviews      INT          NOT NULL DEFAULT 0,
  services     TEXT         NOT NULL COMMENT 'Comma-separated list e.g. Oil Change,Brakes',
  status       ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lat (lat),
  INDEX idx_lng (lng),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CONTACT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS shop_registrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  shop_name  VARCHAR(120) NOT NULL,
  owner_name VARCHAR(80)  NOT NULL,
  email      VARCHAR(120) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  address    TEXT         NOT NULL,
  services   TEXT,
  status     ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SAMPLE DATA (Hyderabad, India area)
INSERT INTO mechanics (name, specialty, lat, lng, phone, address, hours, price_range, rating, reviews, services) VALUES
('AutoPro Garage',      'Engine & Transmission',     17.4200, 78.4800, '+91-98765-43210', 'Shop 12, Industrial Area, Sec-1',    'Mon-Sat: 8AM-8PM',  '₹₹',  4.7, 184, 'Oil Change,Engine Repair,Transmission'),
('QuickFix Motors',     'Oil Change & Brakes',        17.3950, 78.5100, '+91-87654-32109', 'Plot 7B, Main Road, Near City Mall',  'Mon-Sun: 7AM-9PM',  '₹',   4.5, 312, 'Oil Change,Brake Repair,Battery Replacement'),
('City Mechanics',      'Full Service Auto',          17.4500, 78.4600, '+91-76543-21098', '3rd Lane, Auto Nagar, Block C',       'Mon-Fri: 9AM-6PM',  '₹₹₹', 4.9,  97, 'Full Service,AC Repair,Suspension,Alignment'),
('FastTrack Auto',      'Tire & Wheel Specialist',    17.3700, 78.4400, '+91-65432-10987', 'Near Highway Petrol Bunk, West End',  'Mon-Sat: 8AM-7PM',  '₹',   4.3, 256, 'Tire Fitting,Wheel Alignment,Balancing,Tire Service'),
('RoadReady Workshop',  'Electrical & Diagnostics',   17.4100, 78.4200, '+91-54321-09876', 'Shop 5, Tech Park Road, Opp Bus Stand','Open 24/7',         '₹₹',  4.6, 143, 'Electrical,Diagnostics,ECU Repair,Wiring'),
('TurboTech Garage',    'Performance Tuning',         17.3900, 78.5300, '+91-43210-98765', 'Unit 22, Speed Zone, Ring Road',      'Mon-Sun: 6AM-10PM', '₹₹₹', 4.8,  76, 'Performance Tuning,Exhaust Upgrade,Turbo Install,Engine Repair'),
('StreetStar Auto',     'Brake Specialist',           17.4300, 78.5150, '+91-32109-87654', 'Corner Shop, Market Street',          'Mon-Sat: 9AM-8PM',  '₹',   4.4, 201, 'Brake Repair,Brake Pads,Rotors,Drums'),
('PrimeAuto Care',      'AC & Heating',               17.3850, 78.4650, '+91-21098-76543', 'Shop 9, Comfort Zone, East Side',     'Mon-Fri: 8AM-6PM',  '₹₹',  4.5, 119, 'AC Repair,Heating,Blower Motor,Refrigerant Refill'),
('MasterGrip Motors',   'Suspension & Alignment',     17.4350, 78.4350, '+91-10987-65432', 'Plot 18, Wheel Street, Industrial',   'Mon-Sun: 7AM-9PM',  '₹₹',  4.7, 162, 'Suspension,Wheel Alignment,Shocks,Struts'),
('SwiftLane Garage',    'Body & Paint',               17.3750, 78.4250, '+91-09876-54321', 'Colour House, Paint Lane, South',     'Mon-Sat: 10AM-8PM', '₹₹₹', 4.6,  89, 'Denting,Painting,Body Repair,Polish');
