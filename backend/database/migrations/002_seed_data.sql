-- Seed data for employees
-- Password for all: Password123!
INSERT INTO employees (name, email, password_hash, land, is_active, role) VALUES
('Jan Jansen', 'jan.jansen@example.com', '$2b$10$ub5gyr1pHJQIdG6izr45/.LrefJMNx0LylAL6a9JC/f91Kf8ILB6m', 'BE', TRUE, 'employee'),
('Marie Dupont', 'marie.dupont@example.com', '$2b$10$ESZcMTSz7SuL2u9z1fGuJOFU/6qNN.Wkty8kaVWXHjCji0u0MzSDW', 'BE', TRUE, 'employee'),
('Pieter de Vries', 'pieter.de.vries@example.com', '$2b$10$lHJ2nEmudPshcasDbBcf5uKzunGhEwiH7Hq4c2iLqnurPunIBEw3O', 'NL', TRUE, 'employee'),
('Sophie van Dijk', 'sophie.van.dijk@example.com', '$2b$10$nc8I4aeLZ4dJLa8GiNhu5uCSooiRGI/jlC.5yFZG5hWOES5oH4.LG', 'NL', TRUE, 'employee'),
('Kurt Meijer', 'kurt.meijer@example.com', '$2b$10$dKgP9nYh0cdw.JS8c/.p8OG6zINvsXgtQj5mAmAMyYK8RmjRxbeba', 'BE', TRUE, 'employee'),
('HR Admin', 'hr@company.com', '$2b$10$ub5gyr1pHJQIdG6izr45/.LrefJMNx0LylAL6a9JC/f91Kf8ILB6m', 'BE', TRUE, 'hr');

-- Seed data for trajectories
INSERT INTO trajectories (employee_id, name, start_location, end_location, km_single_trip, type, declaration_signed, declaration_signed_at) VALUES
(1, 'Thuis - Kantoor Brussel', 'Leuven', 'Brussel', 10.0, 'volledig', TRUE, CURRENT_TIMESTAMP),
(1, 'Thuis - Station', 'Leuven', 'Station Leuven', 3.5, 'gedeeltelijk', TRUE, CURRENT_TIMESTAMP),
(2, 'Woon-werk traject', 'Antwerpen', 'Mechelen', 15.0, 'volledig', TRUE, CURRENT_TIMESTAMP),
(3, 'Huis - Werk', 'Amsterdam', 'Rotterdam', 20.0, 'volledig', TRUE, CURRENT_TIMESTAMP),
(4, 'Dagelijks traject', 'Utrecht', 'Amsterdam', 12.0, 'volledig', TRUE, CURRENT_TIMESTAMP),
(5, 'Lange afstand', 'Gent', 'Brussel', 25.0, 'volledig', TRUE, CURRENT_TIMESTAMP);

-- Seed data for config
-- BE: €0.27/km (between €0.01-€0.35), max €3160/year (€263.33/month), deadline 15th
-- NL: €0.23/km (max), no yearly limit enforced, deadline 12th
INSERT INTO config (land, tariff_per_km, max_per_month, max_per_year, deadline_day, allow_above_tax_free) VALUES
('BE', 0.27, 263, 3160, 15, FALSE),
('NL', 0.23, 9999, 9999, 12, TRUE);

-- Seed data for rides
INSERT INTO rides (employee_id, trajectory_id, ride_date, direction, portion, km_total, amount_euro, declaration_confirmed, declaration_date, created_at) VALUES
(1, 1, CURRENT_DATE - INTERVAL '5 days', 'heen', 'volledig', 10.0, 2.70, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 1, CURRENT_DATE - INTERVAL '5 days', 'terug', 'volledig', 10.0, 2.70, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, CURRENT_DATE - INTERVAL '3 days', 'heen_terug', 'volledig', 30.0, 8.10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 4, CURRENT_DATE - INTERVAL '2 days', 'heen', 'volledig', 20.0, 4.60, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 5, CURRENT_DATE - INTERVAL '1 day', 'terug', 'volledig', 12.0, 2.76, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 6, CURRENT_DATE - INTERVAL '1 day', 'heen_terug', 'volledig', 50.0, 13.50, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);