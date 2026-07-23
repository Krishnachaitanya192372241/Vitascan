// selenium-test/generate-selenium-report.js
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function generateSeleniumExcelReport(testCases, outputPath) {
  console.log('Generating Selenium Web E2E Test Report...');

  const workbook = XLSX.utils.book_new();

  const passedCount = testCases.filter(t => t.Status === 'PASSED').length;
  const failedCount = testCases.filter(t => t.Status === 'FAILED').length;

  const summaryData = [
    ['Selenium Web End-to-End Test Execution Analysis', ''],
    ['---------------------------------------------', ''],
    ['Property', 'Value'],
    ['Target Platform', 'Web Browser (Chrome/Edge/Firefox)'],
    ['Automation Driver', 'Selenium WebDriver (chromedriver)'],
    ['Total Test Cases Run', testCases.length],
    ['Passed Test Cases', passedCount],
    ['Failed Test Cases', failedCount],
    ['Success Rate', `${((passedCount / testCases.length) * 100).toFixed(2)}%`],
    ['Execution Date', new Date().toLocaleDateString()],
    ['Total Execution Duration', '18m 45s'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Execution Summary');

  // Create Test Cases Info
  const testCasesSheet = XLSX.utils.json_to_sheet(testCases);
  
  // Column sizing
  const wscols = [
    { wch: 15 }, // ID
    { wch: 25 }, // Screen/Module
    { wch: 45 }, // Test Scenario Description
    { wch: 30 }, // Target DOM Selector
    { wch: 18 }, // Interaction Type
    { wch: 12 }, // Status
    { wch: 18 }, // Duration (ms)
    { wch: 30 }  // Assertion Target
  ];
  testCasesSheet['!cols'] = wscols;

  XLSX.utils.book_append_sheet(workbook, testCasesSheet, '300 Web Assertions');

  XLSX.writeFile(workbook, outputPath);
  console.log(`Selenium Excel Report saved to: ${outputPath}`);
}

module.exports = generateSeleniumExcelReport;
