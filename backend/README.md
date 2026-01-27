# UA Volunteering Platform - Backend

Spring Boot 4.0 API for the UA Volunteering Platform.

## Tech Stack

- Java 25 (LTS)
- Spring Boot 4.0.2
- Spring Security + JWT
- Spring Data JPA + PostgreSQL
- Lombok + MapStruct
- JUnit 5 + REST Assured + Testcontainers
- Cucumber for BDD testing

## Prerequisites

### Option 1: Docker (Recommended)
- Docker Desktop installed

### Option 2: Local Development
- Java 25 JDK
- Maven 3.9+
- PostgreSQL 16 (or use Docker for database only)

## Running the Application

### With Docker (Full Stack)

```bash
# From the project root directory
cd ..

# Start PostgreSQL + Backend
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

**Endpoints:**
- API: http://localhost:8080
- Health: http://localhost:8080/api/health
- Swagger UI: http://localhost:8080/swagger-ui.html
- API Docs: http://localhost:8080/api-docs

### With Docker (Database Only)

```bash
# Start only PostgreSQL
cd ..
docker-compose up postgres

# Run Spring Boot locally
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Running Tests

### All Tests
```bash
mvn clean test
```

### Unit Tests Only
```bash
mvn test -Dtest="*Test"
```

### Integration Tests Only
```bash
mvn test -Dtest="*IT"
```

### With Coverage Report
```bash
mvn clean test jacoco:report
# Report available at: target/site/jacoco/index.html
```

### Using Docker
```bash
cd ..
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/ua/tqs/
│   │   │   ├── config/          # Security, OpenAPI configs
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── service/         # Business logic
│   │   │   ├── repository/      # JPA repositories
│   │   │   ├── model/           # Entity classes
│   │   │   │   └── enums/       # Enum types
│   │   │   └── dto/             # Data Transfer Objects
│   │   └── resources/
│   │       ├── application.yml      # Main config
│   │       ├── application-dev.yml  # Development config
│   │       ├── application-test.yml # Test config
│   │       └── application-prod.yml # Production config
│   └── test/
│       ├── java/ua/tqs/         # Test classes
│       └── resources/
│           └── features/        # Cucumber feature files
├── Dockerfile                   # Production image
├── Dockerfile.dev               # Development image
└── pom.xml                      # Maven dependencies
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | - | Active profile (dev, test, prod) |
| `SPRING_DATASOURCE_URL` | jdbc:postgresql://localhost:5432/volunteering | Database URL |
| `SPRING_DATASOURCE_USERNAME` | dev | Database username |
| `SPRING_DATASOURCE_PASSWORD` | dev | Database password |
| `JWT_SECRET` | (dev default) | JWT signing secret (min 256 bits) |

### Profiles

- **default**: Local development with localhost PostgreSQL
- **dev**: Docker development with container networking
- **test**: H2 in-memory database for tests
- **prod**: Production settings (requires env vars)

## API Documentation

After starting the application, access:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

## Code Quality

### Linting
```bash
# Check code style
mvn checkstyle:check
```

### Static Analysis
```bash
# Run SonarCloud analysis (requires SONAR_TOKEN)
mvn sonar:sonar
```

## Troubleshooting

### Port 8080 already in use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs volunteering-db
```

### Maven dependency issues
```bash
# Clean and rebuild
mvn clean install -U
```

## License

MIT License - See LICENSE file for details.
