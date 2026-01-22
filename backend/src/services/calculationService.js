const pool = require('../config/database');

// Calculate the ride amount based on trajectory, direction, portion, and employee's country
async function calculateRideAmount(trajectory, direction, portion, employeeCountry) {
    const tariffResult = await pool.query(`SELECT tariff_per_km FROM config WHERE land = $1`, [employeeCountry]);
    const tariff = parseFloat(tariffResult.rows[0].tariff_per_km);
    let km = parseFloat(trajectory.km_single_trip) || 0;

    // Calculate km based on direction
    if (direction === 'heen_terug') {
        km *= 2;
    }

    // Adjust km based on portion
    if (portion === 'gedeeltelijk') {
        km *= 0.5;
    }

    const amount = (km * tariff).toFixed(2);
    return { km: km.toFixed(2), amount };
}

// Calculate the total amount for all rides in a given month
async function calculateMonthTotal(employeeId, yearMonth) {
    const result = await pool.query(`SELECT SUM(km_total) AS total_km, SUM(amount_euro) AS total_amount FROM rides WHERE employee_id = $1 AND EXTRACT(YEAR FROM ride_date) = $2 AND EXTRACT(MONTH FROM ride_date) = $3`, [employeeId, yearMonth.getFullYear(), yearMonth.getMonth() + 1]);
    return {
        total_km: result.rows[0].total_km ? parseFloat(result.rows[0].total_km).toFixed(2) : '0.00',
        total_amount: result.rows[0].total_amount ? parseFloat(result.rows[0].total_amount).toFixed(2) : '0.00'
    };
}

// Check if the yearly total exceeds the tax-free maximum for Belgium
async function checkBelgiumBlocking(employeeId) {
    // Get employee's country
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const land = employeeResult.rows[0].land;

    // If not Belgium, no blocking needed
    if (land !== 'BE') {
        return { blocked: false, reason: '' };
    }

    // Get Belgium config including allow_above_tax_free setting
    const configResult = await pool.query(`SELECT max_per_year, allow_above_tax_free FROM config WHERE land = 'BE'`);
    const config = configResult.rows[0];

    // If allow_above_tax_free is TRUE, no blocking
    if (config.allow_above_tax_free === true) {
        return { blocked: false, reason: '' };
    }

    // Check yearly total only if allow_above_tax_free is FALSE
    const result = await pool.query(`SELECT COALESCE(SUM(amount_euro), 0) AS total_amount FROM rides WHERE employee_id = $1`, [employeeId]);
    const totalAmount = parseFloat(result.rows[0].total_amount);

    if (totalAmount >= config.max_per_year) {
        return { blocked: true, reason: `Yearly tax-free maximum of €${config.max_per_year} exceeded. Current total: €${totalAmount.toFixed(2)}` };
    }
    return { blocked: false, reason: '' };
}

module.exports = {
    calculateRideAmount,
    calculateMonthTotal,
    checkBelgiumBlocking
};