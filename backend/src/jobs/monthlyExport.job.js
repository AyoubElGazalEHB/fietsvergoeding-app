const exportService = require('../services/exportService');
const fs = require('fs');
const path = require('path');

// Run monthly export
async function runExport() {
  try {
    console.log('📅 Starting monthly export job...');

    // Get previous month
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const yearMonth = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    console.log(`📊 Exporting data for: ${yearMonth}`);

    // Generate export
    const exportData = await exportService.generateMonthlyExport(yearMonth);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Save CSV file
    const filename = `bike_allowance_${yearMonth}_${Date.now()}.csv`;
    const filepath = path.join(exportsDir, filename);
    fs.writeFileSync(filepath, exportData.csv);

    console.log(`✅ Export saved: ${filepath}`);
    console.log(`📈 Summary:`, exportData.summary);

    // Mark month as exported
    await exportService.markMonthAsExported(yearMonth);
    console.log(`✅ Month ${yearMonth} marked as exported`);

    return {
      success: true,
      filepath,
      summary: exportData.summary
    };
  } catch (error) {
    console.error('❌ Monthly export job failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  runExport
};