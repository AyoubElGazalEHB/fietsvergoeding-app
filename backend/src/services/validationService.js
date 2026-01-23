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

async function checkMonthlyMax(employeeId, rideYear, rideMonth) {
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const land = employeeResult.rows[0].land;

    if (land === 'NL') return;

    const configResult = await pool.query(`SELECT max_per_year FROM config WHERE land = $1`, [land]);
    const maxPerYear = configResult.rows[0].max_per_year;
    const monthlyMax = maxPerYear / 12;

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
        throw new Error(`Maandlimiet €${monthlyMax.toFixed(2)} bereikt. Huidige totaal: €${totalAmount.toFixed(2)}`);
    }
}

async function checkDeclaration(declarationConfirmed, employeeCountry) {
    const configResult = await pool.query(
        `SELECT allow_above_tax_free FROM config WHERE land = $1`,
        [employeeCountry]
    );
    
    // For BE, declaration always required
    // For NL, only if company doesn't allow above tax-free
    if (employeeCountry === 'BE' || !configResult.rows[0]?.allow_above_tax_free) {
        if (!declarationConfirmed) {
            throw new Error('Verklaring op eer moet bevestigd worden');
        }
    }
}

async function validateRideInput(rideData) {
    const { employeeId, rideDate, declarationConfirmed, km } = rideData;
    
    if (!km || parseFloat(km) <= 0) {
        throw new Error('Afstand moet groter zijn dan 0 km');
    }
    
    const employeeResult = await pool.query(`SELECT land FROM employees WHERE id = $1`, [employeeId]);
    const employeeCountry = employeeResult.rows[0].land;
    
    await checkDeclaration(declarationConfirmed, employeeCountry);
    await checkMaxRidesPerDay(employeeId, rideDate);
    await checkDeadline(employeeId, rideDate);
    
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