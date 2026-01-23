-- Remove trajectory_id from rides table since employees now manually enter km
ALTER TABLE rides DROP CONSTRAINT rides_trajectory_id_fkey;
ALTER TABLE rides DROP COLUMN trajectory_id;
