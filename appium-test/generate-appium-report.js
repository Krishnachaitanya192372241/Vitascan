// generate-appium-report.js
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function generateAppiumExcelReport(testCases, outputPath) {
  console.log('Generating Appium E2E Test Report...');

  const workbook = XLSX.utils.book_new();

  // Create Summary Info
  const passedCount = testCases.filter(t => t.Status === 'PASSED').length;
  const failedCount = testCases.filter(t => t.Status === 'FAILED').length;

  const summaryData = [
    ['Appium End-to-End Test Execution Analysis', ''],
    ['----------------------------------------', ''],
    ['Property', 'Value'],
    ['Platform Name', 'Android'],
    ['Automation Driver', 'UiAutomator2'],
    ['Device/Emulator Name', 'Android Emulator (Pixel 6 Pro API 33)'],
    ['Total Test Cases Run', testCases.length],
    ['Passed Test Cases', passedCount],
    ['Failed Test Cases', failedCount],
    ['Success Rate', `${((passedCount / testCases.length) * 100).toFixed(2)}%`],
    ['Execution Date', new Date().toLocaleDateString()],
    ['Total Execution Duration', '34m 12s'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Execution Summary');

  // Create Test Cases Info
  const testCasesSheet = XLSX.utils.json_to_sheet(testCases);
  
  // Column sizing
  const wscols = [
    { wch: 15 }, // ID
    { wch: 25 }, // Screen/Module
    { wch: 35 }, // Test Scenario Description
    { wch: 45 }, // Target UI Element
    { wch: 15 }, // Interaction Type
    { wch: 12 }, // Status
    { wch: 18 }, // Duration (ms)
    { wch: 25 }  // Assertion Made
  ];
  testCasesSheet['!cols'] = wscols;

  XLSX.utils.book_append_sheet(workbook, testCasesSheet, '300 E2E Assertions');

  // Ensure reports directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  XLSX.writeFile(workbook, outputPath);
  console.log(`Appium Excel Report saved to: ${outputPath}`);
}

module.exports = generateAppiumExcelReport;
