import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Baseline load test
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<350', 'p(99)<800'], // P95 < 350ms, P99 < 800ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/health'); // Mock target
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  sleep(1);
}
