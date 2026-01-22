const pool = require('../config/database');

// Check if the employee has already registered 2 rides for the given date
async function checkMaxRidesPerDay(employeeId, date) {
    const result = await pool.query(`SELECT COUNT(*) FROM rides WHERE employee_id = $1 AND ride_date = $2`, [employeeId, date]);
    const count = parseInt(result.rows[0].count);
    if (count >= 2) {
        throw new Error('Max 2 rides per employee per day exceeded.');
    }
}

// Check if the current date is before the deadline for the employee's country
async function checkDeadline(employeeId, rideDate) {
    const result = await pool.query(
        `SELECT c.deadline_day FROM employees e JOIN config c ON e.land = c.land WHERE e.id = $1`, 
        [employeeId]
    );
    const deadlineDay = result.rows[0].deadline_day;
    
    // Parse ride date
    const ride = new Date(rideDate);
    const rideYear = ride.getFullYear();
    const rideMonth = ride.getMonth();
    
    // Calculate NEXT month for deadline
    let nextMonth = rideMonth + 1;
    let nextYear = rideYear;
    
    // Handle December → January rollover
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = rideYear + 1;
    }
    
    // Create deadline in NEXT month
    const deadlineDate = new Date(nextYear, nextMonth, deadlineDay);
    
    if (new Date() > deadlineDate) {
        throw new Error(`Ride registration deadline has passed. Deadline was ${deadlineDate.toLocaleDateString()}`);
    }
}

// Check if adding this ride would exceed the monthly maximum for Belgium
async function checkMonthlyMax(employeeId, rideYear, rideMonth) {
    // Get employee's country
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const land = employeeResult.rows[0].land;

    // Skip check for Netherlands - no monthly limit
    if (land === 'NL') {
        return;
    }

    // For Belgium, check against monthly max
    const configResult = await pool.query(`SELECT max_per_year FROM config WHERE land = $1`, [land]);
    const maxPerYear = configResult.rows[0].max_per_year;
    const monthlyMax = maxPerYear / 12;

    // Get total amount for the month
    const amountResult = await pool.query(
        `SELECT COALESCE(SUM(amount_euro), 0) AS total_amount FROM rides WHERE employee_id = $1 AND EXTRACT(YEAR FROM ride_date) = $2 AND EXTRACT(MONTH FROM ride_date) = $3`,
        [employeeId, rideYear, rideMonth]
    );
    const totalAmount = parseFloat(amountResult.rows[0].total_amount);

    if (totalAmount >= monthlyMax) {
        throw new Error(`Monthly maximum of €${monthlyMax.toFixed(2)} exceeded. Current total: €${totalAmount.toFixed(2)}`);
    }
}

// Validate ride input by combining all validations
async function validateRideInput(rideData) {
    const { employeeId, rideDate } = rideData;
    await checkMaxRidesPerDay(employeeId, rideDate);
    await checkDeadline(employeeId, rideDate);
    
    // Extract year and month from rideDate
    const rideDateTime = new Date(rideDate);
    const rideYear = rideDateTime.getFullYear();
    const rideMonth = rideDateTime.getMonth() + 1;
    
    await checkMonthlyMax(employeeId, rideYear, rideMonth);
}

module.exports = {
    checkMaxRidesPerDay,
    checkDeadline,
    checkMonthlyMax,
    validateRideInput
};