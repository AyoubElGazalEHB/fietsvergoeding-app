const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireHR } = require('../middleware/auth.middleware');

router.get('/employees', authenticate, requireHR, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id, e.name, e.email, e.land, e.is_active, e.custom_tariff,
        COALESCE(SUM(r.km_total), 0) as total_km,
        COALESCE(SUM(r.amount_euro), 0) as total_amount,
        COUNT(r.id) as total_rides
      FROM employees e
      LEFT JOIN rides r ON e.id = r.employee_id
      GROUP BY e.id
      ORDER BY e.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get employees' });
  }
});

router.patch('/employees/:id/tariff', authenticate, requireHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { custom_tariff } = req.body;
    
    const result = await pool.query(
      'UPDATE employees SET custom_tariff = $1 WHERE id = $2 RETURNING *',
      [custom_tariff, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tariff' });
  }
});

router.get('/employees/:id/rides', authenticate, requireHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { year_month } = req.query;
    
    let query = `SELECT * FROM rides WHERE employee_id = $1`;
    const params = [id];
    
    if (year_month) {
      const [year, month] = year_month.split('-').map(Number);
      query += ` AND EXTRACT(YEAR FROM ride_date) = $2 AND EXTRACT(MONTH FROM ride_date) = $3`;
      params.push(year, month);
    }
    
    query += ` ORDER BY ride_date DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get rides' });
  }
});

module.exports = router;