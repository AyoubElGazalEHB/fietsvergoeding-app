const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const validationService = require('../services/validationService');
const calculationService = require('../services/calculationService');
const pool = require('../config/database');

// Helper function to get trajectory by ID
async function getTrajectory(trajectoryId) {
  const result = await pool.query('SELECT * FROM trajectories WHERE id = $1', [trajectoryId]);
  if (result.rows.length === 0) {
    throw new Error('Trajectory not found');
  }
  return result.rows[0];
}

// POST /api/rides - Create new ride
router.post('/', authenticate, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { trajectory_id, ride_date, direction, portion } = req.body;

    // Validate input
    if (!trajectory_id || !ride_date || !direction || !portion) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Prepare ride data for validation
    const rideData = {
      employeeId,
      rideDate: ride_date,
      trajectory_id,
      direction,
      portion
    };

    // Validate ride input (max 2/day, deadline, monthly max)
    await validationService.validateRideInput(rideData);

    // Check Belgium blocking
    const blockingResult = await calculationService.checkBelgiumBlocking(employeeId);
    if (blockingResult.blocked) {
      return res.status(403).json({ message: blockingResult.reason });
    }

    // Get trajectory
    const trajectory = await getTrajectory(trajectory_id);

    // Calculate ride amount
    const { km, amount } = await calculationService.calculateRideAmount(
      trajectory,
      direction,
      portion,
      req.user.land
    );

    // Insert ride into database
    const result = await pool.query(
      `INSERT INTO rides (employee_id, trajectory_id, ride_date, direction, portion, km_total, amount_euro) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [employeeId, trajectory_id, ride_date, direction, portion, km, amount]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET /api/rides/month/:yearMonth - Get all rides for employee for that month
router.get('/month/:yearMonth', authenticate, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { yearMonth } = req.params;

    // Validate format
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return res.status(400).json({ message: 'Invalid year-month format. Use YYYY-MM' });
    }

    const [year, month] = yearMonth.split('-').map(Number);

    // Query rides for the specified month
    const rides = await pool.query(
      `SELECT * FROM rides 
       WHERE employee_id = $1 
         AND EXTRACT(YEAR FROM ride_date) = $2 
         AND EXTRACT(MONTH FROM ride_date) = $3
       ORDER BY ride_date DESC`,
      [employeeId, year, month]
    );

    // Calculate monthly total
    const total = await calculationService.calculateMonthTotal(
      employeeId,
      new Date(year, month - 1, 1)
    );

    // Check if month is exported
    const summaryResult = await pool.query(
      `SELECT status FROM monthly_summaries 
       WHERE employee_id = $1 AND EXTRACT(YEAR FROM year_month) = $2 AND EXTRACT(MONTH FROM year_month) = $3`,
      [employeeId, year, month]
    );

    const status = summaryResult.rows.length > 0 ? summaryResult.rows[0].status : 'open';

    res.json({
      rides: rides.rows,
      summary: {
        total_km: total.total_km,
        total_amount: total.total_amount,
        status
      }
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/rides/:id - Delete a ride
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const rideId = req.params.id;
    const employeeId = req.user.id;

    // Check if ride exists and belongs to user
    const ride = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND employee_id = $2',
      [rideId, employeeId]
    );

    if (ride.rows.length === 0) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const rideDate = ride.rows[0].ride_date;

    // Check deadline
    await validationService.checkDeadline(employeeId, rideDate);

    // Delete ride
    await pool.query('DELETE FROM rides WHERE id = $1', [rideId]);

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;