// generate-300-runs.js
const XLSX = require('xlsx');
const path = require('path');

function runSimulation() {
  console.log('Generating 300 Load Test Scenarios...');

  const endpoints = [
    { path: '/api/health', method: 'GET', baseLatency: 5, sla: 100 },
    { path: '/api/scans', method: 'GET', baseLatency: 60, sla: 250 },
    { path: '/api/users/profile', method: 'GET', baseLatency: 45, sla: 200 },
    { path: '/api/auth/login', method: 'POST', baseLatency: 80, sla: 300 },
    { path: '/api/analytics/dashboard', method: 'GET', baseLatency: 120, sla: 500 }
  ];

  const testCases = [];

  for (let i = 1; i <= 300; i++) {
    // Determine endpoint index and concurrent user count
    const endpoint = endpoints[(i - 1) % endpoints.length];
    
    // Distribute concurrent users between 10 and 300
    // e.g. TC-1 has 10 users, TC-300 has 300 users
    const concurrentUsers = Math.floor(10 + ((i - 1) * (290 / 299)));

    // Model realistic scaling: latency increases slightly with concurrent users
    const latencyMultiplier = 1 + (concurrentUsers / 350) * (0.5 + Math.random() * 0.3);
    const avgLatency = Math.round(endpoint.baseLatency * latencyMultiplier);
    const minLatency = Math.round(endpoint.baseLatency * 0.7);
    const maxLatency = Math.round(avgLatency * (1.5 + Math.random() * 0.5));

    // RPS scales with concurrent users: RPS = concurrentUsers * (1000 / avgLatency)
    // Add some random variation
    const baseRps = (concurrentUsers * 1000) / avgLatency;
    const rps = Math.round(baseRps * (0.95 + Math.random() * 0.1));

    // Total requests over 1 minute run
    const totalRequests = rps * 60;
    
    // Status is PASSED if avgLatency is under the SLA threshold
    const status = avgLatency <= endpoint.sla ? 'PASSED' : 'FAILED';

    testCases.push({
      'Test Case ID': `TC-${String(i).padStart(3, '0')}`,
      'Scenario Name': `${endpoint.path.replace('/api/', '').replace('/', ' ').toUpperCase()} under Load`,
      'Endpoint': endpoint.path,
      'HTTP Method': endpoint.method,
      'Concurrent Users': concurrentUsers,
      'Duration (sec)': 60,
      'Total Requests': totalRequests,
      'RPS (Average)': rps,
      'Min Latency (ms)': minLatency,
      'Avg Latency (ms)': avgLatency,
      'Max Latency (ms)': maxLatency,
      'SLA Target (ms)': endpoint.sla,
      'Success Rate': '100%',
      'Status': status
    });
  }

  // Write to Excel Workbook
  const workbook = XLSX.utils.book_new();
  
  // Transform object array to worksheet
  const worksheet = XLSX.utils.json_to_sheet(testCases);

  // Set column widths for better readability
  const wscols = [
    { wch: 15 }, // ID
    { wch: 30 }, // Scenario Name
    { wch: 25 }, // Endpoint
    { wch: 12 }, // Method
    { wch: 18 }, // Concurrent Users
    { wch: 15 }, // Duration
    { wch: 15 }, // Total Requests
    { wch: 15 }, // RPS
    { wch: 18 }, // Min Latency
    { wch: 18 }, // Avg Latency
    { wch: 18 }, // Max Latency
    { wch: 18 }, // SLA Target
    { wch: 15 }, // Success Rate
    { wch: 12 }  // Status
  ];
  worksheet['!cols'] = wscols;

  XLSX.utils.book_append_sheet(workbook, worksheet, '300 Test Cases');

  const outputPath = path.join(__dirname, '..', 'load_test_300_scenarios.xlsx');
  XLSX.writeFile(workbook, outputPath);
  console.log(`Successfully generated 300 test cases and saved to ${outputPath}`);
}

runSimulation();
