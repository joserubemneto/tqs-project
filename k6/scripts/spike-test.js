import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Spike test configuration - simulates sudden traffic spikes
export const options = {
  stages: [
    { duration: '30s', target: 10 },    // Warm up
    { duration: '1m', target: 10 },     // Steady state
    { duration: '10s', target: 200 },   // Spike!
    { duration: '2m', target: 200 },    // Stay at spike
    { duration: '10s', target: 10 },    // Scale back down
    { duration: '1m', target: 10 },     // Recovery
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95% of requests should be below 2s
    http_req_failed: ['rate<0.15'],       // Allow up to 15% failed requests during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Focus on the most common user flows
  const scenarios = [
    () => {
      // Health check
      const response = http.get(`${BASE_URL}/api/health`);
      check(response, { 'health status is 200': (r) => r.status === 200 });
      return response;
    },
    () => {
      // Browse opportunities
      const page = Math.floor(Math.random() * 5);
      const response = http.get(`${BASE_URL}/api/opportunities?page=${page}&size=10`);
      check(response, { 'opportunities status is 200': (r) => r.status === 200 });
      return response;
    },
    () => {
      // Browse with filters
      const response = http.get(`${BASE_URL}/api/opportunities?page=0&size=10&sortBy=startDate&sortDir=desc`);
      check(response, { 'filtered opportunities status is 200': (r) => r.status === 200 });
      return response;
    },
  ];
  
  // Random scenario selection with bias towards opportunity browsing
  const weights = [1, 5, 4];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedIndex = 0;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedIndex = i;
      break;
    }
  }
  
  const response = scenarios[selectedIndex]();
  errorRate.add(response.status !== 200);
  
  sleep(0.3);
}
