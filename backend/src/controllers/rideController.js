const express = require('express');
const jwt = require('jsonwebtoken');
const validationService = require('../services/validationService');
const calculationService = require('../services/calculationService');
const pool = require('../database'); // Ensure you have the correct path to your database connection
const router = express.Router();

// Helper function to get trajectory by ID
async function getTrajectory(trajectoryId) {
    const result = await pool.query('SELECT * FROM trajectories WHERE id = $1', [trajectoryId]);
    if (result.rows.length === 0) {
        throw new Error('Trajectory not found');
    }
    return result.rows[0];
}

// POST /api/rides - creates new ride
router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const employeeId = decoded.id;
        const rideData = req.body;

        // Validate ride input
        await validationService.validateRideInput(rideData);

        // Check if the employee is from Belgium and if they are blocked
        const blockingResult = await calculationService.checkBelgiumBlocking(employeeId);
        if (blockingResult.blocked) {
            return res.status(403).json({ message: blockingResult.reason });
        }

        // Calculate ride amount
        const trajectory = await getTrajectory(rideData.trajectory_id); // Assume this function fetches the trajectory
        const { km, amount } = await calculationService.calculateRideAmount(trajectory, rideData.direction, rideData.portion, decoded.land);

        // Insert ride into database
        const result = await pool.query(`INSERT INTO rides (employee_id, trajectory_id, ride_date, direction, portion, km_total, amount_euro) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [employeeId, rideData.trajectory_id, rideData.ride_date, rideData.direction, rideData.portion, km, amount]);

        // Return ride with calculated amount
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

// GET /api/rides/month/:yearMonth - get all rides for employee for that month
router.get('/month/:yearMonth', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const employeeId = decoded.id;
        const yearMonth = req.params.yearMonth;

        // Query rides for the specified month
        const rides = await pool.query(`SELECT * FROM rides WHERE employee_id = $1 AND EXTRACT(YEAR FROM ride_date) = $2 AND EXTRACT(MONTH FROM ride_date) = $3`, [employeeId, yearMonth.split('-')[0], yearMonth.split('-')[1]]);

        // Calculate monthly total
        const total = await calculationService.calculateMonthTotal(employeeId, new Date(yearMonth));

        // Return rides array and summary
        return res.status(200).json({ rides: rides.rows, summary: total });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

module.exports = router;