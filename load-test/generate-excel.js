// generate-excel.js
const XLSX = require('xlsx');
const path = require('path');

function generateExcelReport(results, outputPath) {
  console.log('Generating Excel Report...');

  const workbook = XLSX.utils.book_new();

  // --- Sheet 1: Summary ---
  const summaryData = [
    ['Load Test Run Summary', ''],
    ['-------------------', ''],
    ['Test Parameter', 'Value'],
    ['Target URL', results.url],
    ['Virtual Users (Connections)', results.connections],
    ['Duration (seconds)', results.duration],
    ['Total Requests Sent', results.requests.sent],
    ['Total Responses Received', results.requests.average * results.duration], // Estimate or exact responses
    ['Success Rate', `${((results.requests.sent - results.errors) / results.requests.sent * 100).toFixed(2)}%`],
    ['', ''],
    ['Throughput Metrics', ''],
    ['-------------------', ''],
    ['Requests Per Second (RPS) - Average', `${results.requests.average.toFixed(2)} req/sec`],
    ['Requests Per Second (RPS) - Min', `${results.requests.min} req/sec`],
    ['Requests Per Second (RPS) - Max', `${results.requests.max} req/sec`],
    ['Transfer Rate (Average)', `${(results.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`],
    ['', ''],
    ['Latency Metrics', ''],
    ['-------------------', ''],
    ['Average Latency', `${results.latency.average.toFixed(2)} ms`],
    ['Minimum Latency', `${results.latency.min} ms`],
    ['Maximum Latency', `${results.latency.max} ms`],
    ['Total Errors', results.errors || 0]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Test Summary');

  // --- Sheet 2: Latency Percentiles ---
  const percentilesData = [
    ['Percentile', 'Latency (ms)'],
    ['10%', results.latency.p10 || 'N/A'],
    ['25%', results.latency.p25 || 'N/A'],
    ['50% (Median)', results.latency.p50],
    ['75%', results.latency.p75 || 'N/A'],
    ['90%', results.latency.p90],
    ['95%', results.latency.p95 || 'N/A'],
    ['97.5%', results.latency.p97_5],
    ['99%', results.latency.p99],
    ['99.9%', results.latency.p99_9],
    ['99.99%', results.latency.p99_99]
  ];

  const percentilesSheet = XLSX.utils.aoa_to_sheet(percentilesData);
  XLSX.utils.book_append_sheet(workbook, percentilesSheet, 'Latency Percentiles');

  // Write workbook to file
  XLSX.writeFile(workbook, outputPath);
  console.log(`Excel Report successfully saved to: ${outputPath}`);
}

module.exports = generateExcelReport;
