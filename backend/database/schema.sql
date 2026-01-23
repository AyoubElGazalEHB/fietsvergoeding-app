CREATE TYPE land_enum AS ENUM ('BE', 'NL');
CREATE TYPE type_enum AS ENUM ('volledig', 'gedeeltelijk');
CREATE TYPE direction_enum AS ENUM ('heen', 'terug', 'heen_terug');
CREATE TYPE portion_enum AS ENUM ('volledig', 'gedeeltelijk');
CREATE TYPE status_enum AS ENUM ('open', 'verwerkt');

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    land land_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    custom_tariff DECIMAL(5, 2),
    role VARCHAR(50) DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trajectories (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    km_single_trip DECIMAL(5, 2) NOT NULL,
    type type_enum NOT NULL,
    declaration_signed BOOLEAN DEFAULT FALSE,
    declaration_signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    trajectory_id INT REFERENCES trajectories(id) ON DELETE SET NULL,
    ride_date DATE NOT NULL,
    direction direction_enum NOT NULL,
    portion portion_enum NOT NULL,
    km_total DECIMAL(5, 2) NOT NULL,
    amount_euro DECIMAL(10, 2) NOT NULL,
    declaration_confirmed BOOLEAN DEFAULT FALSE,
    declaration_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_ride UNIQUE (employee_id, ride_date, direction)
);

CREATE TABLE monthly_summaries (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    year_month DATE NOT NULL,
    total_km DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status status_enum NOT NULL,
    exported_at TIMESTAMP,
    CONSTRAINT unique_employee_month UNIQUE (employee_id, year_month)
);

CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    land land_enum NOT NULL,
    tariff_per_km DECIMAL(5, 2) NOT NULL,
    max_per_month INT NOT NULL,
    max_per_year INT NOT NULL,
    deadline_day INT NOT NULL,
    allow_above_tax_free BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_employee_id ON rides(employee_id);
CREATE INDEX idx_ride_date ON rides(ride_date);

-- Ensure max 2 rides per employee per day
CREATE FUNCTION check_max_rides() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM rides WHERE employee_id = NEW.employee_id AND ride_date = NEW.ride_date) >= 2 THEN
        RAISE EXCEPTION 'Max 2 rides per employee per day exceeded';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER max_rides_trigger
BEFORE INSERT ON rides
FOR EACH ROW EXECUTE FUNCTION check_max_rides();