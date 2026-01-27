# UA Volunteering Platform

[![Backend CI](https://github.com/joserubemneto/tqs-project/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/joserubemneto/tqs-project/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/joserubemneto/tqs-project/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/joserubemneto/tqs-project/actions/workflows/frontend-ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=joserubemneto_tqs-project&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=joserubemneto_tqs-project)

Digital volunteering marketplace for Universidade de Aveiro (UA). The platform connects volunteering opportunities with students, faculty, and staff, featuring a points-based rewards system.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 4.0, Java 25, PostgreSQL 16 |
| Frontend | React 19, Vite 7, TypeScript, TanStack Router, Tailwind CSS 4 |
| Testing | JUnit 5, Mockito, REST Assured, Testcontainers, Cucumber, Vitest, Playwright |
| DevOps | Docker, GitHub Actions, SonarCloud, JaCoCo |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Java 25, Node.js 24 for local development

### Run with Docker (Recommended)

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# API Health: http://localhost:8080/api/health
```

### Run Tests

```bash
# Backend tests (in Docker)
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Backend tests (local)
cd backend && ./mvnw clean verify

# Frontend tests (local)
cd frontend && pnpm test:run
```

## Project Structure

```
tqs-project/
├── backend/                 # Spring Boot API
│   ├── src/main/java/      # Application code
│   ├── src/test/java/      # Tests (unit, integration, BDD)
│   └── Dockerfile          # Production image
├── frontend/               # React application
│   ├── src/                # Application code
│   └── Dockerfile          # Production image
├── docker-compose.yml      # Development environment
├── docker-compose.test.yml # Test environment
└── .github/workflows/      # CI/CD pipelines
```

## CI/CD Pipeline

### Backend Pipeline (`backend-ci.yml`)

| Stage | Description |
|-------|-------------|
| Build | Compile Java code |
| Test | Run unit + integration tests |
| Coverage | JaCoCo report (≥80% required) |
| SonarCloud | Static analysis |

### Frontend Pipeline (`frontend-ci.yml`)

| Stage | Description |
|-------|-------------|
| Install | pnpm install dependencies |
| Lint | Biome check (lint + format) |
| Type Check | TypeScript validation |
| Test | Vitest with coverage |
| Build | Production build |
| SonarCloud | Static analysis |

### Setup SonarCloud

1. Go to [sonarcloud.io](https://sonarcloud.io) and import your GitHub repository
2. Add `SONAR_TOKEN` to GitHub repository secrets
3. Update badge URLs in this README with your username

## API Documentation

When running locally, Swagger UI is available at:
- http://localhost:8080/swagger-ui.html

## License

This project is developed for TQS (Testing and Software Quality) course at Universidade de Aveiro.
