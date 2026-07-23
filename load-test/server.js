// server.js
const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Set JSON headers
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else if (req.url === '/api/scans' && req.method === 'GET') {
    // Simulate database lookup/processing delay (e.g. random 40-100ms)
    const delay = Math.floor(Math.random() * 60) + 40; 
    setTimeout(() => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: [
          { id: 1, scanType: 'vitamins', score: 85, date: '2026-07-20' },
          { id: 2, scanType: 'minerals', score: 92, date: '2026-07-21' }
        ]
      }));
    }, delay);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Mock API Server running at http://localhost:${PORT}`);
});
