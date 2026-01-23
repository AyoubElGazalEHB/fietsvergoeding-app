const pool = require('../config/database');

async function checkMaxRidesPerDay(employeeId, date) {
    const result = await pool.query(
        `SELECT COUNT(*) FROM rides WHERE employee_id = $1 AND ride_date = $2`, 
        [employeeId, date]
    );
    const count = parseInt(result.rows[0].count);
    if (count >= 2) {
        throw new Error('Maximum 2 ritten per dag al geregistreerd');
    }
}

async function checkDeadline(employeeId, rideDate) {
    const result = await pool.query(
        `SELECT c.deadline_day FROM employees e JOIN config c ON e.land = c.land WHERE e.id = $1`, 
        [employeeId]
    );
    const deadlineDay = result.rows[0].deadline_day;
    
    const ride = new Date(rideDate);
    const rideYear = ride.getFullYear();
    const rideMonth = ride.getMonth();
    
    let nextMonth = rideMonth + 1;
    let nextYear = rideYear;
    
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = rideYear + 1;
    }
    
    const deadlineDate = new Date(nextYear, nextMonth, deadlineDay);
    
    if (new Date() > deadlineDate) {
        throw new Error(`Deadline verstreken: ${deadlineDate.toLocaleDateString()}`);
    }
}

/**
 * Check monthly maximum for Belgium
 * Belgium: €3160/year = €263.33/month
 * Netherlands: No monthly limit enforced
 */
async function checkMonthlyMax(employeeId, rideYear, rideMonth) {
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const land = employeeResult.rows[0].land;

    // Netherlands has no monthly limit
    if (land === 'NL') return;

    const configResult = await pool.query(
        `SELECT max_per_month, allow_above_tax_free FROM config WHERE land = $1`,
        [land]
    );
    const config = configResult.rows[0];

    // If company allows above tax-free, no monthly limit
    if (config.allow_above_tax_free) return;

    const monthlyMax = parseFloat(config.max_per_month);

    const amountResult = await pool.query(
        `SELECT COALESCE(SUM(amount_euro), 0) AS total_amount
         FROM rides
         WHERE employee_id = $1
           AND EXTRACT(YEAR FROM ride_date) = $2
           AND EXTRACT(MONTH FROM ride_date) = $3`,
        [employeeId, rideYear, rideMonth]
    );
    const totalAmount = parseFloat(amountResult.rows[0].total_amount);

    if (totalAmount >= monthlyMax) {
        throw new Error(`Maandlimiet €${monthlyMax.toFixed(2)} bereikt. Huidig totaal: €${totalAmount.toFixed(2)}`);
    }
}

/**
 * Check declaration of honor requirement
 * Belgium: Always required
 * Netherlands: Required if using own bike or borrowed money for bike
 */
async function checkDeclaration(declarationConfirmed, employeeCountry) {
    // Declaration is always required for all employees
    // They must have signed a declaration stating the km distance
    if (!declarationConfirmed) {
        throw new Error('Verklaring op eer moet bevestigd worden. U moet vooraf aangeven wat het aantal kilometers is voor de gehele of gedeeltelijke afstand.');
    }
}

/**
 * Validate ride input before creating a ride
 * Checks: declaration, max rides per day, deadline, monthly max
 */
async function validateRideInput(rideData) {
    const { employeeId, rideDate, declarationConfirmed, trajectory_id } = rideData;

    // Validate trajectory exists
    if (!trajectory_id) {
        throw new Error('Traject moet geselecteerd worden');
    }

    const trajectoryResult = await pool.query(
        `SELECT km_single_trip FROM trajectories WHERE id = $1 AND employee_id = $2`,
        [trajectory_id, employeeId]
    );

    if (trajectoryResult.rows.length === 0) {
        throw new Error('Ongeldig traject geselecteerd');
    }

    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const employeeCountry = employeeResult.rows[0].land;

    // Check declaration (always required)
    await checkDeclaration(declarationConfirmed, employeeCountry);

    // Check max 2 rides per day
    await checkMaxRidesPerDay(employeeId, rideDate);

    // Check deadline
    await checkDeadline(employeeId, rideDate);

    // Check monthly maximum (Belgium only)
    const rideDateTime = new Date(rideDate);
    const rideYear = rideDateTime.getFullYear();
    const rideMonth = rideDateTime.getMonth() + 1;

    await checkMonthlyMax(employeeId, rideYear, rideMonth);
}

module.exports = {
    checkMaxRidesPerDay,
    checkDeadline,
    checkMonthlyMax,
    checkDeclaration,
    validateRideInput
};