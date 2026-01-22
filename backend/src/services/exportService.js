const pool = require('../config/database');
const { Parser } = require('json2csv');

// Generate CSV export for a specific month
async function generateMonthlyExport(yearMonth) {
  try {
    // Parse year-month
    const [year, month] = yearMonth.split('-').map(Number);

    // Get all rides for the month
    const result = await pool.query(
      `SELECT 
        e.id as employee_id,
        e.name as employee_name,
        e.email,
        e.land,
        SUM(r.km_total) as total_km,
        SUM(r.amount_euro) as total_amount,
        COUNT(r.id) as total_rides
      FROM employees e
      LEFT JOIN rides r ON e.id = r.employee_id 
        AND EXTRACT(YEAR FROM r.ride_date) = $1 
        AND EXTRACT(MONTH FROM r.ride_date) = $2
      WHERE e.is_active = TRUE
      GROUP BY e.id, e.name, e.email, e.land
      HAVING COUNT(r.id) > 0
      ORDER BY e.id`,
      [year, month]
    );

    const data = result.rows.map(row => ({
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      email: row.email,
      land: row.land,
      reference_month: yearMonth,
      total_km: parseFloat(row.total_km).toFixed(2),
      total_amount: parseFloat(row.total_amount).toFixed(2),
      total_rides: row.total_rides
    }));

    // Convert to CSV
    const fields = [
      'employee_id',
      'employee_name', 
      'email',
      'land',
      'reference_month',
      'total_km',
      'total_amount',
      'total_rides'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    return {
      csv,
      data,
      summary: {
        total_employees: data.length,
        total_km: data.reduce((sum, row) => sum + parseFloat(row.total_km), 0).toFixed(2),
        total_amount: data.reduce((sum, row) => sum + parseFloat(row.total_amount), 0).toFixed(2)
      }
    };
  } catch (error) {
    console.error('Export generation error:', error);
    throw new Error('Failed to generate export');
  }
}

// Mark month as exported (update monthly_summaries)
async function markMonthAsExported(yearMonth) {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    
    await pool.query(
      `INSERT INTO monthly_summaries (employee_id, year_month, total_km, total_amount, status, exported_at)
       SELECT 
         e.id,
         $1::date,
         COALESCE(SUM(r.km_total), 0),
         COALESCE(SUM(r.amount_euro), 0),
         'verwerkt',
         NOW()
       FROM employees e
       LEFT JOIN rides r ON e.id = r.employee_id 
         AND EXTRACT(YEAR FROM r.ride_date) = $2 
         AND EXTRACT(MONTH FROM r.ride_date) = $3
       WHERE e.is_active = TRUE
       GROUP BY e.id
       ON CONFLICT (employee_id, year_month) 
       DO UPDATE SET 
         total_km = EXCLUDED.total_km,
         total_amount = EXCLUDED.total_amount,
         status = 'verwerkt',
         exported_at = NOW()`,
      [yearMonth + '-01', year, month]
    );

    return { success: true, message: 'Month marked as exported' };
  } catch (error) {
    console.error('Mark exported error:', error);
    throw new Error('Failed to mark month as exported');
  }
}

module.exports = {
  generateMonthlyExport,
  markMonthAsExported
};