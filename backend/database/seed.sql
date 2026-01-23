-- Clear existing data
TRUNCATE TABLE rides CASCADE;
TRUNCATE TABLE trajectories CASCADE;
TRUNCATE TABLE monthly_summaries CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE config CASCADE;

-- Insert employees
INSERT INTO employees (name, email, password_hash, land, is_active) VALUES
('Jan Jansen', 'jan.jansen@example.com', '$2b$10$ub5gyr1pHJQIdG6izr45/.LrefJMNx0LylAL6a9JC/f91Kf8ILB6m', 'BE', TRUE),
('Marie Dupont', 'marie.dupont@example.com', '$2b$10$ESZcMTSz7SuL2u9z1fGuJOFU/6qNN.Wkty8kaVWXHjCji0u0MzSDW', 'BE', TRUE),
('Pieter de Vries', 'pieter.de.vries@example.com', '$2b$10$lHJ2nEmudPshcasDbBcf5uKzunGhEwiH7Hq4c2iLqnurPunIBEw3O', 'NL', TRUE),
('Sophie van Dijk', 'sophie.van.dijk@example.com', '$2b$10$nc8I4aeLZ4dJLa8GiNhu5uCSooiRGI/jlC.5yFZG5hWOES5oH4.LG', 'NL', TRUE),
('Kurt Meijer', 'kurt.meijer@example.com', '$2b$10$dKgP9nYh0cdw.JS8c/.p8OG6zINvsXgtQj5mAmAMyYK8RmjRxbeba', 'BE', TRUE),
('HR Admin', 'hr@company.com', '$2b$10$5w9lZ.Lf4qK0LQxRW6.zmeT0y.y5K5x7Q9Zx2J0P1L2M3N4O5P6Q7', 'BE', TRUE);

-- Insert config
INSERT INTO config (land, tariff_per_km, max_per_month, max_per_year, deadline_day, allow_above_tax_free) VALUES
('BE', 0.27, 2200, 2200, 15, FALSE),
('NL', 0.23, 1800, 1800, 12, FALSE);

-- Insert trajectories
INSERT INTO trajectories (employee_id, km_single_trip, type) VALUES
(1, 10.0, 'volledig'),
(1, 15.0, 'gedeeltelijk'),
(2, 5.0, 'volledig'),
(3, 20.0, 'volledig'),
(4, 12.0, 'gedeeltelijk'),
(5, 25.0, 'volledig');

-- Insert sample rides
INSERT INTO rides (employee_id, ride_date, direction, portion, km_total, amount_euro, created_at) VALUES
(1, CURRENT_DATE - INTERVAL '5 days', 'heen', 'volledig', 10.0, 2.70, CURRENT_TIMESTAMP),
(1, CURRENT_DATE - INTERVAL '5 days', 'terug', 'gedeeltelijk', 7.5, 2.03, CURRENT_TIMESTAMP),
(2, CURRENT_DATE - INTERVAL '3 days', 'heen_terug', 'volledig', 10.0, 2.70, CURRENT_TIMESTAMP),
(3, CURRENT_DATE - INTERVAL '2 days', 'heen', 'gedeeltelijk', 10.0, 2.30, CURRENT_TIMESTAMP),
(4, CURRENT_DATE - INTERVAL '1 day', 'terug', 'volledig', 12.0, 2.76, CURRENT_TIMESTAMP),
(5, CURRENT_DATE - INTERVAL '1 day', 'heen_terug', 'gedeeltelijk', 25.0, 6.75, CURRENT_TIMESTAMP);
