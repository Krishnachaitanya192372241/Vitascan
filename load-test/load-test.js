// load-test.js
const autocannon = require('autocannon');

function runLoadTest() {
  console.log('Starting load test with 100 connections for 60 seconds...');
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: 'http://localhost:3000/api/scans',
      connections: 100,
      duration: 60,
      headers: {
        'content-type': 'application/json'
      }
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    // Track real-time progress
    autocannon.track(instance, { render: false });
    
    let tickCount = 0;
    instance.on('tick', () => {
      tickCount++;
      // Print progress status every 5 seconds
      if (tickCount % 5 === 0) {
        console.log(`Load test in progress... Elapsed: ${tickCount}s / 60s`);
      }
    });
  });
}

module.exports = runLoadTest;
