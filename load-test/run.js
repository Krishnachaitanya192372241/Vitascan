// run.js
const { fork } = require('child_process');
const path = require('path');
const runLoadTest = require('./load-test');
const generateExcelReport = require('./generate-excel');

async function main() {
  console.log('=== STARTING BASELINE LOAD TEST SUITE ===');

  // 1. Start the Mock Server
  const serverPath = path.join(__dirname, 'server.js');
  console.log(`Starting Mock Server from: ${serverPath}`);
  const serverProcess = fork(serverPath);

  // Allow server some time to start up
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // 2. Run the Load Test
    const results = await runLoadTest();

    // 3. Print Console Summary Table
    console.log('\n=== LOAD TEST COMPLETED SUCCESSFULLY ===');
    console.log(`Total Requests Sent: ${results.requests.sent}`);
    console.log(`Average RPS:         ${results.requests.average.toFixed(2)} req/sec`);
    console.log(`Min Latency:         ${results.latency.min} ms`);
    console.log(`Average Latency:     ${results.latency.average.toFixed(2)} ms`);
    console.log(`Max Latency:         ${results.latency.max} ms`);
    console.log('========================================\n');

    // 4. Generate Excel Report in the workspace root
    const excelOutputPath = path.join(__dirname, '..', 'load_test_results.xlsx');
    generateExcelReport(results, excelOutputPath);

  } catch (error) {
    console.error('Error occurred during load test execution:', error);
  } finally {
    // 5. Terminate the Mock Server process
    console.log('Stopping Mock Server...');
    serverProcess.kill('SIGINT');
    console.log('Mock Server stopped.');
  }
}

main();
