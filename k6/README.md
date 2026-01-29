# K6 Load Testing

This directory contains k6 load test scripts for the UA Volunteering Platform.

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed locally, OR
- Docker and Docker Compose

## Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Make sure the backend is running first
docker compose up -d

# Run health check test
docker compose -f k6/docker-compose.k6.yml run --rm k6 run /scripts/health-check.js

# Run opportunities browsing test
docker compose -f k6/docker-compose.k6.yml run --rm k6 run /scripts/opportunities-browse.js

# Run auth flow test
docker compose -f k6/docker-compose.k6.yml run --rm k6 run /scripts/auth-flow.js

# Run stress test
docker compose -f k6/docker-compose.k6.yml run --rm k6 run /scripts/stress-test.js

# Run spike test
docker compose -f k6/docker-compose.k6.yml run --rm k6 run /scripts/spike-test.js
```

### Option 2: Local k6 Installation

```bash
# Install k6 (macOS)
brew install k6

# Run tests
cd k6
k6 run scripts/health-check.js
k6 run scripts/opportunities-browse.js
k6 run scripts/auth-flow.js
```

## Test Scripts

| Script | Description | Duration | Max VUs |
|--------|-------------|----------|---------|
| `health-check.js` | Basic health endpoint test | ~3.5 min | 50 |
| `opportunities-browse.js` | Simulates users browsing opportunities | ~5 min | 50 |
| `auth-flow.js` | Registration and login flows | ~2 min | 5 |
| `stress-test.js` | Pushes system to find breaking points | ~23 min | 300 |
| `spike-test.js` | Simulates sudden traffic spikes | ~5 min | 200 |

## Configuration

### Environment Variables

- `BASE_URL`: Backend API URL (default: `http://localhost:8080`)

```bash
# Example: Test against a different environment
k6 run -e BASE_URL=http://staging.example.com scripts/health-check.js
```

### Custom Thresholds

You can override default options using k6 CLI flags:

```bash
# Run with more users
k6 run --vus 100 --duration 5m scripts/health-check.js

# Run with custom thresholds
k6 run --threshold 'http_req_duration{p(95)<200}' scripts/health-check.js
```

## Output Formats

### JSON Output

```bash
k6 run --out json=results/output.json scripts/health-check.js
```

### CSV Output

```bash
k6 run --out csv=results/output.csv scripts/health-check.js
```

### InfluxDB (for Grafana dashboards)

```bash
# Start monitoring stack
docker compose -f k6/docker-compose.k6.yml --profile monitoring up -d

# Run tests with InfluxDB output
docker compose -f k6/docker-compose.k6.yml run --rm k6 run \
  --out influxdb=http://influxdb:8086/k6 \
  /scripts/health-check.js

# Access Grafana at http://localhost:3001
```

## Understanding Results

### Key Metrics

- **http_req_duration**: Response time (aim for p95 < 500ms)
- **http_req_failed**: Failed request rate (aim for < 1%)
- **http_reqs**: Requests per second
- **vus**: Virtual users

### Example Output

```
✓ status is 200
✓ response time < 500ms

http_req_duration...: avg=123.45ms min=50.12ms med=100.23ms max=500.67ms p(90)=200.45ms p(95)=300.12ms
http_req_failed.....: 0.00%  ✓ 0   ✗ 1234
http_reqs...........: 1234   205.67/s
vus.................: 50     min=1  max=50
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
load-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Start application
      run: docker compose up -d
      
    - name: Wait for backend
      run: |
        until curl -s http://localhost:8080/api/health | grep -q "UP"; do
          sleep 5
        done
    
    - name: Run k6 load tests
      uses: grafana/k6-action@v0.3.1
      with:
        filename: k6/scripts/health-check.js
        flags: --out json=results.json
      env:
        BASE_URL: http://localhost:8080
    
    - name: Upload results
      uses: actions/upload-artifact@v4
      with:
        name: k6-results
        path: results.json
```

## Writing Custom Tests

Create a new test file in `k6/scripts/`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const response = http.get(`${BASE_URL}/api/your-endpoint`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

## Troubleshooting

### Connection Refused

If you get connection errors when running with Docker:

1. Ensure the backend is running: `docker compose ps`
2. Check that `host.docker.internal` resolves correctly
3. Try using the container network: `--network=tqs-project_default`

### High Error Rate

1. Check backend logs: `docker compose logs backend`
2. Verify database connection
3. Check for rate limiting or connection pool exhaustion
