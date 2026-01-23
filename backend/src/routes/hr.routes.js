const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireHR } = require('../middleware/auth.middleware');
const exportService = require('../services/exportService');

// GET /api/hr/config - Get all configs (HR only)
router.get('/hr/config', authenticate, requireHR, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM config ORDER BY land');
    res.json(result.rows);
  } catch (error) {
    console.error('Get all configs error:', error);
    res.status(500).json({ message: 'Failed to get configs' });
  }
});

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

// POST /api/hr/trajectories - Create trajectory for employee (HR only)
router.post('/hr/trajectories', authenticate, requireHR, async (req, res) => {
  try {
    const { employee_id, km_single_trip, type } = req.body;

    if (!employee_id || !km_single_trip || !type) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (!['volledig', 'gedeeltelijk'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const result = await pool.query(
      'INSERT INTO trajectories (employee_id, km_single_trip, type) VALUES ($1, $2, $3) RETURNING *',
      [employee_id, parseFloat(km_single_trip), type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create trajectory error:', error);
    res.status(500).json({ message: 'Failed to create trajectory' });
  }
});

// GET /api/hr/all-trajectories - Get all trajectories (HR only)
router.get('/hr/all-trajectories', authenticate, requireHR, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, e.name as employee_name, e.email 
       FROM trajectories t 
       JOIN employees e ON t.employee_id = e.id 
       ORDER BY e.name, t.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all trajectories error:', error);
    res.status(500).json({ message: 'Failed to get trajectories' });
  }
});

// GET /api/hr/dashboard/:year/:month - Get dashboard data (alias for monthly-rides)
router.get('/hr/dashboard/:year/:month', authenticate, requireHR, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Get all rides for the month
    const ridesResult = await pool.query(
      `SELECT r.*, e.name as employee_name, e.land
       FROM rides r
       JOIN employees e ON r.employee_id = e.id
       WHERE EXTRACT(YEAR FROM r.ride_date) = $1
       AND EXTRACT(MONTH FROM r.ride_date) = $2
       ORDER BY r.ride_date DESC, e.name ASC`,
      [yearNum, monthNum]
    );

    // Get summary per employee
    const summaryResult = await pool.query(
      `SELECT
        e.id,
        e.name as employee_name,
        e.land,
        COUNT(r.id) as ride_count,
        COALESCE(SUM(r.km_total), 0) as total_km,
        COALESCE(SUM(r.amount_euro), 0) as total_amount
       FROM employees e
       LEFT JOIN rides r ON e.id = r.employee_id
        AND EXTRACT(YEAR FROM r.ride_date) = $1
        AND EXTRACT(MONTH FROM r.ride_date) = $2
       WHERE e.is_active = true
       GROUP BY e.id, e.name, e.land
       ORDER BY e.name ASC`,
      [yearNum, monthNum]
    );

    res.json({
      rides: ridesResult.rows,
      summary: summaryResult.rows
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// GET /api/hr/monthly-rides/:year/:month - Get all rides for a specific month
router.get('/hr/monthly-rides/:year/:month', authenticate, requireHR, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Get all rides for the month
    const ridesResult = await pool.query(
      `SELECT r.*, e.name as employee_name
       FROM rides r
       JOIN employees e ON r.employee_id = e.id
       WHERE EXTRACT(YEAR FROM r.ride_date) = $1
       AND EXTRACT(MONTH FROM r.ride_date) = $2
       ORDER BY r.ride_date DESC, e.name ASC`,
      [yearNum, monthNum]
    );

    // Get summary per employee
    const summaryResult = await pool.query(
      `SELECT 
        e.id,
        e.name as employee_name,
        COUNT(r.id) as ride_count,
        COALESCE(SUM(r.km_total), 0) as total_km,
        COALESCE(SUM(r.amount_euro), 0) as total_amount
       FROM employees e
       LEFT JOIN rides r ON e.id = r.employee_id 
        AND EXTRACT(YEAR FROM r.ride_date) = $1
        AND EXTRACT(MONTH FROM r.ride_date) = $2
       WHERE e.is_active = true
       GROUP BY e.id, e.name
       ORDER BY e.name ASC`,
      [yearNum, monthNum]
    );

    const summary = {};
    summaryResult.rows.forEach(row => {
      summary[row.id] = {
        employee_name: row.employee_name,
        ride_count: parseInt(row.ride_count),
        total_km: parseFloat(row.total_km).toFixed(2),
        total_amount: parseFloat(row.total_amount).toFixed(2)
      };
    });

    res.json({
      rides: ridesResult.rows,
      summary: summary
    });
  } catch (error) {
    console.error('Get monthly rides error:', error);
    res.status(500).json({ message: 'Failed to fetch monthly rides' });
  }
});

// GET /api/hr/export-csv/:year/:month - Export rides as CSV
router.get('/hr/export-csv/:year/:month', authenticate, requireHR, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    const ridesResult = await pool.query(
      `SELECT r.*, e.name as employee_name
       FROM rides r
       JOIN employees e ON r.employee_id = e.id
       WHERE EXTRACT(YEAR FROM r.ride_date) = $1
       AND EXTRACT(MONTH FROM r.ride_date) = $2
       ORDER BY r.ride_date DESC, e.name ASC`,
      [yearNum, monthNum]
    );

    // Generate CSV
    let csv = 'Werknemer,Datum,Afstand (km),Richting,Type,Bedrag (€)\n';
    
    const directionMap = { heen: 'Heenreis', terug: 'Terugreis', heen_terug: 'Heen & Terug' };
    const portionMap = { volledig: 'Volledig per fiets', gedeeltelijk: 'Gedeeltelijk' };

    ridesResult.rows.forEach(ride => {
      const date = new Date(ride.ride_date).toLocaleDateString('nl-NL');
      const direction = directionMap[ride.direction] || ride.direction;
      const portion = portionMap[ride.portion] || ride.portion;
      csv += `${ride.employee_name},${date},${parseFloat(ride.km_total).toFixed(2)},${direction},${portion},${parseFloat(ride.amount_euro).toFixed(2)}\n`;
    });

    // Add summary
    csv += '\n\nSAMENVATTING PER WERKNEMER\n';
    csv += 'Werknemer,Aantal ritten,Totaal km,Totaal bedrag (€)\n';

    const summaryResult = await pool.query(
      `SELECT 
        e.name as employee_name,
        COUNT(r.id) as ride_count,
        COALESCE(SUM(r.km_total), 0) as total_km,
        COALESCE(SUM(r.amount_euro), 0) as total_amount
       FROM employees e
       LEFT JOIN rides r ON e.id = r.employee_id 
        AND EXTRACT(YEAR FROM r.ride_date) = $1
        AND EXTRACT(MONTH FROM r.ride_date) = $2
       WHERE e.is_active = true
       GROUP BY e.name
       ORDER BY e.name ASC`,
      [yearNum, monthNum]
    );

    summaryResult.rows.forEach(row => {
      csv += `${row.employee_name},${parseInt(row.ride_count)},${parseFloat(row.total_km).toFixed(2)},${parseFloat(row.total_amount).toFixed(2)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rides_${year}_${month}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export CSV' });
  }
});

// DELETE /api/hr/trajectories/:id - Delete trajectory (HR only)
router.delete('/hr/trajectories/:id', authenticate, requireHR, async (req, res) => {
  try {
    const { id } = req.params;

    const ridesCheck = await pool.query(
      'SELECT COUNT(*) FROM rides WHERE trajectory_id = $1',
      [id]
    );

    if (parseInt(ridesCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete trajectory with existing rides' });
    }

    await pool.query('DELETE FROM trajectories WHERE id = $1', [id]);
    res.json({ message: 'Trajectory deleted' });
  } catch (error) {
    console.error('Delete trajectory error:', error);
    res.status(500).json({ message: 'Failed to delete trajectory' });
  }
});

module.exports = router;