import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const listDuration = new Trend('opportunities_list_duration');
const detailDuration = new Trend('opportunity_detail_duration');

// Test configuration - simulates users browsing opportunities
export const options = {
  scenarios: {
    browse_opportunities: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // Ramp up
        { duration: '2m', target: 20 },    // Steady state
        { duration: '1m', target: 50 },    // Peak load
        { duration: '1m', target: 50 },    // Sustain peak
        { duration: '30s', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],   // 95% of requests should be below 1s
    http_req_failed: ['rate<0.01'],       // Less than 1% failed requests
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  let opportunityIds = [];
  
  group('List Opportunities', () => {
    // Browse opportunities with pagination
    const pages = [0, 1, 2];
    const page = pages[Math.floor(Math.random() * pages.length)];
    
    const listResponse = http.get(
      `${BASE_URL}/api/opportunities?page=${page}&size=10&sortBy=startDate&sortDir=asc`
    );
    
    listDuration.add(listResponse.timings.duration);
    
    const listSuccess = check(listResponse, {
      'list status is 200': (r) => r.status === 200,
      'list returns content array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.content);
        } catch {
          return false;
        }
      },
      'list response time < 1s': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!listSuccess);
    
    // Extract opportunity IDs for detail view
    if (listSuccess && listResponse.body) {
      try {
        const body = JSON.parse(listResponse.body);
        opportunityIds = body.content.map(o => o.id);
      } catch {
        // ignore parsing errors
      }
    }
  });
  
  sleep(1);
  
  // Simulate user clicking on a specific opportunity
  if (opportunityIds.length > 0) {
    group('View Opportunity Detail', () => {
      const randomId = opportunityIds[Math.floor(Math.random() * opportunityIds.length)];
      
      const detailResponse = http.get(`${BASE_URL}/api/opportunities/${randomId}`);
      
      detailDuration.add(detailResponse.timings.duration);
      
      const detailSuccess = check(detailResponse, {
        'detail status is 200': (r) => r.status === 200,
        'detail has title': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.title && body.title.length > 0;
          } catch {
            return false;
          }
        },
        'detail response time < 500ms': (r) => r.timings.duration < 500,
      });
      
      errorRate.add(!detailSuccess);
    });
  }
  
  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}
