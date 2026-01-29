import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const registrations = new Counter('registrations');
const logins = new Counter('logins');

// Test configuration
export const options = {
  scenarios: {
    registration_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 5 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests should be below 2s
    errors: ['rate<0.05'],               // Error rate should be less than 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const headers = {
  'Content-Type': 'application/json',
};

export default function () {
  const uniqueId = randomString(8);
  const email = `loadtest_${uniqueId}@test.com`;
  const password = 'TestPassword123!';
  
  group('Registration Flow', () => {
    // Register a new user
    const registerPayload = JSON.stringify({
      email: email,
      password: password,
      name: `Load Test User ${uniqueId}`,
      role: 'VOLUNTEER',
    });
    
    const registerResponse = http.post(
      `${BASE_URL}/api/auth/register`,
      registerPayload,
      { headers }
    );
    
    const registerSuccess = check(registerResponse, {
      'registration status is 201': (r) => r.status === 201,
      'registration returns token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token && body.token.length > 0;
        } catch {
          return false;
        }
      },
    });
    
    if (registerSuccess) {
      registrations.add(1);
    }
    errorRate.add(!registerSuccess);
  });
  
  sleep(1);
  
  group('Login Flow', () => {
    const loginPayload = JSON.stringify({
      email: email,
      password: password,
    });
    
    const loginResponse = http.post(
      `${BASE_URL}/api/auth/login`,
      loginPayload,
      { headers }
    );
    
    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login returns token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token && body.token.length > 0;
        } catch {
          return false;
        }
      },
    });
    
    if (loginSuccess) {
      logins.add(1);
    }
    errorRate.add(!loginSuccess);
  });
  
  sleep(2);
}
