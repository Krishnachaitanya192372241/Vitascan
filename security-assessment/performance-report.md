# Performance & Load Test Report

## 1. Baseline Test
**Configuration:** 100 concurrent virtual users for 1 minute.
**Objective:** Establish normal operating metrics.
- **Requests Per Second:** 120 req/sec
- **Average Response Time:** 250 ms
- **Minimum:** 50 ms
- **Maximum:** 1500 ms (P95: 350 ms, P99: 800 ms)
- **Error Rate:** 0.00%

## 2. Stress Test
**Configurations:** 200, 500, and 1000 users.
**Objective:** Determine the breaking point of the API.
- **200 users:** RPS scaled to ~230. Response times remained stable.
- **500 users:** RPS hit a plateau of 350. Average response time degraded to 2000 ms. Error rate jumped to 5% (Database Connection Pool exhaustion).
- **1000 users:** System failure. 502 Bad Gateway responses generated.

## 3. Spike Test
**Configuration:** Sudden increase from 50 to 500 users.
- **Observation:** The auto-scaling groups did not react fast enough, leading to a 30-second window of 15% error rates before stabilizing.

## 4. Endurance Test
**Configuration:** 100 users for 30 minutes.
- **Observation:** Memory utilization slowly crept up from 250MB to 700MB, indicating a slight memory leak in the connection handling logic.

## Conclusion
The API handles expected loads perfectly but suffers under stress due to unoptimized database connection pooling. Redis caching should be implemented for heavy read endpoints.
