const pool = require('../config/database');

/**
 * Calculate ride amount based on trajectory, direction, and portion
 * @param {Object} trajectory - Trajectory object with km_single_trip
 * @param {string} direction - 'heen', 'terug', or 'heen_terug'
 * @param {string} portion - 'volledig' or 'gedeeltelijk'
 * @param {number} employeeId - Employee ID
 * @returns {Object} { km, amount }
 */
async function calculateRideAmount(trajectory, direction, portion, employeeId) {
    // Get employee info
    const employeeResult = await pool.query(
        `SELECT custom_tariff, land FROM employees WHERE id = $1`,
        [employeeId]
    );
    const employee = employeeResult.rows[0];

    // Determine tariff
    let tariff;
    if (employee.custom_tariff) {
        tariff = parseFloat(employee.custom_tariff);
        // Validate custom tariff for Belgium (must be between €0.01 and €0.35)
        if (employee.land === 'BE' && (tariff < 0.01 || tariff > 0.35)) {
            throw new Error('Tarief voor België moet tussen €0.01 en €0.35 liggen');
        }
        // Validate custom tariff for Netherlands (max €0.23)
        if (employee.land === 'NL' && tariff > 0.23) {
            throw new Error('Tarief voor Nederland mag niet hoger zijn dan €0.23');
        }
    } else {
        const configResult = await pool.query(
            `SELECT tariff_per_km FROM config WHERE land = $1`,
            [employee.land]
        );
        tariff = parseFloat(configResult.rows[0].tariff_per_km);
    }

    // Calculate kilometers based on trajectory
    let km = parseFloat(trajectory.km_single_trip) || 0;

    // Apply direction multiplier
    if (direction === 'heen_terug') {
        km *= 2;
    }

    // Apply portion multiplier
    if (portion === 'gedeeltelijk') {
        km *= 0.5;
    }

    const amount = (km * tariff).toFixed(2);
    return { km: km.toFixed(2), amount };
}

async function calculateMonthTotal(employeeId, yearMonth) {
    const result = await pool.query(
        `SELECT SUM(km_total) AS total_km, SUM(amount_euro) AS total_amount 
         FROM rides 
         WHERE employee_id = $1 
           AND EXTRACT(YEAR FROM ride_date) = $2 
           AND EXTRACT(MONTH FROM ride_date) = $3`, 
        [employeeId, yearMonth.getFullYear(), yearMonth.getMonth() + 1]
    );
    return {
        total_km: result.rows[0].total_km ? parseFloat(result.rows[0].total_km).toFixed(2) : '0.00',
        total_amount: result.rows[0].total_amount ? parseFloat(result.rows[0].total_amount).toFixed(2) : '0.00'
    };
}

/**
 * Check if Belgian employee is blocked from registering rides
 * Belgium has a yearly tax-free maximum of €3160
 * @param {number} employeeId - Employee ID
 * @returns {Object} { blocked, reason }
 */
async function checkBelgiumBlocking(employeeId) {
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const land = employeeResult.rows[0].land;

    // Only applies to Belgium
    if (land !== 'BE') {
        return { blocked: false, reason: '' };
    }

    const configResult = await pool.query(`SELECT max_per_year, allow_above_tax_free FROM config WHERE land = 'BE'`);
    const config = configResult.rows[0];

    // If company allows above tax-free, no blocking
    if (config.allow_above_tax_free === true) {
        return { blocked: false, reason: '' };
    }

    // Check yearly total for current year
    const result = await pool.query(
        `SELECT COALESCE(SUM(amount_euro), 0) AS total_amount
         FROM rides
         WHERE employee_id = $1
         AND EXTRACT(YEAR FROM ride_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [employeeId]
    );
    const totalAmount = parseFloat(result.rows[0].total_amount);

    if (totalAmount >= config.max_per_year) {
        return {
            blocked: true,
            reason: `Jaarlijks belastingvrij maximum van €${config.max_per_year} bereikt. Huidig totaal: €${totalAmount.toFixed(2)}`
        };
    }
    return { blocked: false, reason: '' };
}

module.exports = {
    calculateRideAmount,
    calculateMonthTotal,
    checkBelgiumBlocking
};