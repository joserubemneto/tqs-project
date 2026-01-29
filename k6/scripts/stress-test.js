import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Stress test configuration - pushes the system to find breaking points
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 300 },   // Ramp up to 300 users
    { duration: '5m', target: 300 },   // Stay at 300 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<3000'],  // 99% of requests should be below 3s
    http_req_failed: ['rate<0.1'],       // Less than 10% failed requests under stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Mix of endpoints to simulate realistic traffic
  const endpoints = [
    { url: '/api/health', weight: 1 },
    { url: '/api/opportunities?page=0&size=10', weight: 5 },
    { url: '/api/opportunities?page=1&size=10', weight: 3 },
    { url: '/api/opportunities?page=2&size=10', weight: 2 },
  ];
  
  // Weighted random selection
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedEndpoint = endpoints[0].url;
  
  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      selectedEndpoint = endpoint.url;
      break;
    }
  }
  
  const response = http.get(`${BASE_URL}${selectedEndpoint}`);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  
  sleep(0.5);
}
