-- Migration to add missing fields to existing tables

-- Add missing fields to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS custom_tariff DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing fields to trajectories table
ALTER TABLE trajectories 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS start_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS end_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS declaration_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS declaration_signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing trajectories with default values
UPDATE trajectories 
SET name = 'Woon-werk traject ' || id,
    start_location = 'Thuis',
    end_location = 'Werk'
WHERE name IS NULL;

-- Make trajectory fields NOT NULL after setting defaults
ALTER TABLE trajectories 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN start_location SET NOT NULL,
ALTER COLUMN end_location SET NOT NULL;

-- Add missing fields to rides table
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS declaration_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS declaration_date TIMESTAMP;

-- Update trajectory_id constraint to SET NULL instead of CASCADE
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_trajectory_id_fkey;
ALTER TABLE rides ADD CONSTRAINT rides_trajectory_id_fkey 
    FOREIGN KEY (trajectory_id) REFERENCES trajectories(id) ON DELETE SET NULL;

-- Update config table with correct values for Belgium and Netherlands
UPDATE config SET max_per_year = 3160 WHERE land = 'BE';
UPDATE config SET tariff_per_km = 0.27 WHERE land = 'BE' AND tariff_per_km != 0.27;
UPDATE config SET tariff_per_km = 0.23 WHERE land = 'NL' AND tariff_per_km != 0.23;

-- Ensure HR users have correct role
UPDATE employees SET role = 'hr' WHERE email LIKE '%hr%' OR email LIKE '%admin%';
UPDATE employees SET role = 'employee' WHERE role IS NULL;

