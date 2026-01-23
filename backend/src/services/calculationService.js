const pool = require('../config/database');

async function calculateRideAmount(trajectory, direction, portion, employeeId) {
    const employeeResult = await pool.query(
        `SELECT custom_tariff, land FROM employees WHERE id = $1`, 
        [employeeId]
    );
    const employee = employeeResult.rows[0];
    
    let tariff;
    if (employee.custom_tariff) {
        tariff = parseFloat(employee.custom_tariff);
    } else {
        const configResult = await pool.query(
            `SELECT tariff_per_km FROM config WHERE land = $1`, 
            [employee.land]
        );
        tariff = parseFloat(configResult.rows[0].tariff_per_km);
    }

    let km = parseFloat(trajectory.km_single_trip) || 0;

    if (direction === 'heen_terug') {
        km *= 2;
    }

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

async function checkBelgiumBlocking(employeeId) {
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const land = employeeResult.rows[0].land;

    if (land !== 'BE') {
        return { blocked: false, reason: '' };
    }

    const configResult = await pool.query(`SELECT max_per_year, allow_above_tax_free FROM config WHERE land = 'BE'`);
    const config = configResult.rows[0];

    if (config.allow_above_tax_free === true) {
        return { blocked: false, reason: '' };
    }

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