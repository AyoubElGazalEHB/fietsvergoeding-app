const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireHR } = require('../middleware/auth.middleware');
const exportService = require('../services/exportService');

// GET /api/config/:land - Get config for a country
router.get('/config/:land', authenticate, async (req, res) => {
  try {
    const { land } = req.params;

    if (!['BE', 'NL'].includes(land)) {
      return res.status(400).json({ message: 'Invalid land parameter' });
    }

    const result = await pool.query(
      'SELECT * FROM config WHERE land = $1',
      [land]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Config not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ message: 'Failed to get config' });
  }
});

// PATCH /api/config/:land - Update config (HR only)
router.patch('/config/:land', authenticate, requireHR, async (req, res) => {
  try {
    const { land } = req.params;
    const { tariff_per_km, max_per_month, max_per_year, deadline_day, allow_above_tax_free } = req.body;

    if (!['BE', 'NL'].includes(land)) {
      return res.status(400).json({ message: 'Invalid land parameter' });
    }

    // Validate tariff
    if (tariff_per_km && parseFloat(tariff_per_km) <= 0) {
      return res.status(400).json({ message: 'Tariff must be greater than 0' });
    }

    // Validate deadline
    if (deadline_day && (parseInt(deadline_day) < 1 || parseInt(deadline_day) > 31)) {
      return res.status(400).json({ message: 'Deadline day must be between 1 and 31' });
    }

    const result = await pool.query(
      `UPDATE config 
       SET tariff_per_km = COALESCE($1, tariff_per_km),
           max_per_month = COALESCE($2, max_per_month),
           max_per_year = COALESCE($3, max_per_year),
           deadline_day = COALESCE($4, deadline_day),
           allow_above_tax_free = COALESCE($5, allow_above_tax_free)
       WHERE land = $6
       RETURNING *`,
      [tariff_per_km, max_per_month, max_per_year, deadline_day, allow_above_tax_free, land]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ message: 'Failed to update config' });
  }
});

// GET /api/trajectories - Get trajectories for current user
router.get('/trajectories', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trajectories WHERE employee_id = $1 ORDER BY id',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get trajectories error:', error);
    res.status(500).json({ message: 'Failed to get trajectories' });
  }
});

// GET /api/check-status - Check if user can register rides
router.get('/check-status', authenticate, async (req, res) => {
  try {
    // Get config for user's country
    const configResult = await pool.query(
      'SELECT deadline_day, allow_above_tax_free, max_per_year FROM config WHERE land = $1',
      [req.user.land]
    );
    
    const config = configResult.rows[0];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Calculate deadline for current month (next month + deadline day)
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    const deadline = new Date(nextYear, nextMonth, config.deadline_day);
    const pastDeadline = today > deadline;

    // Check Belgium blocking
    let blocked = false;
    let reason = '';

    if (req.user.land === 'BE' && !config.allow_above_tax_free) {
      const amountResult = await pool.query(
        'SELECT COALESCE(SUM(amount_euro), 0) as total FROM rides WHERE employee_id = $1',
        [req.user.id]
      );
      const totalAmount = parseFloat(amountResult.rows[0].total);
      
      if (totalAmount >= config.max_per_year) {
        blocked = true;
        reason = `Yearly maximum of €${config.max_per_year} exceeded`;
      }
    }

    res.json({
      blocked,
      pastDeadline,
      reason: blocked ? reason : (pastDeadline ? 'Registration deadline passed' : '')
    });
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ message: 'Failed to check status' });
  }
});

// GET /api/hr/employees - Get all employees with monthly totals (HR only)
router.get('/hr/employees', authenticate, requireHR, async (req, res) => {
  try {
    const { year_month } = req.query;

    let query = `
      SELECT 
        e.id,
        e.name,
        e.email,
        e.land,
        e.is_active,
        COUNT(r.id) as total_rides,
        COALESCE(SUM(r.km_total), 0) as total_km,
        COALESCE(SUM(r.amount_euro), 0) as total_amount
      FROM employees e
      LEFT JOIN rides r ON e.id = r.employee_id
    `;

    const params = [];
    
    if (year_month) {
      const [year, month] = year_month.split('-').map(Number);
      query += ` AND EXTRACT(YEAR FROM r.ride_date) = $1 AND EXTRACT(MONTH FROM r.ride_date) = $2`;
      params.push(year, month);
    }

    query += ` GROUP BY e.id ORDER BY e.id`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to get employees' });
  }
});

// POST /api/hr/export/:yearMonth - Generate export (HR only)
router.post('/hr/export/:yearMonth', authenticate, requireHR, async (req, res) => {
  try {
    const { yearMonth } = req.params;

    // Validate format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return res.status(400).json({ message: 'Invalid year-month format. Use YYYY-MM' });
    }

    const exportData = await exportService.generateMonthlyExport(yearMonth);
    
    // Mark as exported
    await exportService.markMonthAsExported(yearMonth);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bike_allowance_${yearMonth}.csv`);
    
    res.send(exportData.csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to generate export' });
  }
});

module.exports = router;