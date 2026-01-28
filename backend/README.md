# UA Volunteering Platform - Backend

Spring Boot 4.0 API for the UA Volunteering Platform.

## Tech Stack

- Java 25 (LTS)
- Spring Boot 4.0.2
- Spring Security + JWT
- Spring Data JPA + PostgreSQL
- **Flyway** for database migrations
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
│   │       ├── db/migration/        # Flyway migrations
│   │       │   ├── V1__*.sql        # PostgreSQL migrations
│   │       │   ├── h2/              # H2 migrations (for tests)
│   │       │   └── undo/            # Rollback scripts
│   │       ├── application.yml      # Main config
│   │       ├── application-dev.yml  # Development config
│   │       ├── application-test.yml # Test config
│   │       └── application-prod.yml # Production config
│   └── test/
│       ├── java/ua/tqs/         # Test classes
│       └── resources/
│           └── features/        # Cucumber feature files
├── scripts/
│   └── migrate.sh               # Migration CLI script
├── Dockerfile                   # Production image
├── Dockerfile.dev               # Development image
└── pom.xml                      # Maven dependencies
```

## Database Migrations (Flyway)

This project uses **Flyway** for database schema management. Migrations are run separately from the application deployment for safety and rollback support.

### Migration Files

```
src/main/resources/db/migration/
├── V1__initial_schema.sql          # PostgreSQL migrations
├── h2/
│   └── V1__initial_schema.sql      # H2-compatible migrations (for tests)
└── undo/
    └── U1__undo_initial_schema.sql # Rollback scripts
```

### Running Migrations Locally

```bash
# Using the migration script (recommended)
export FLYWAY_URL="jdbc:postgresql://localhost:5432/volunteering"
export FLYWAY_USER="dev"
export FLYWAY_PASSWORD="dev"
./scripts/migrate.sh migrate

# Or using Maven directly
mvn flyway:info     # Show migration status
mvn flyway:migrate  # Run pending migrations
mvn flyway:validate # Validate migrations
mvn flyway:repair   # Repair schema history
```

### Creating New Migrations

1. Create a new file in `src/main/resources/db/migration/`:
   - Format: `V{version}__{description}.sql` (e.g., `V2__add_user_avatar.sql`)
   - Versions must be sequential
   
2. Create H2-compatible version in `db/migration/h2/` for tests

3. Create undo script in `db/migration/undo/`:
   - Format: `U{version}__{description}.sql`

### Migration Best Practices

- **Always use transactions**: PostgreSQL supports transactional DDL
- **Never modify existing migrations**: Create new migrations instead
- **Test migrations locally first**: Run against a copy of production data
- **Include rollback scripts**: For every migration, create an undo script

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | - | Active profile (dev, test, prod) |
| `SPRING_DATASOURCE_URL` | jdbc:postgresql://localhost:5432/volunteering | Database URL |
| `SPRING_DATASOURCE_USERNAME` | dev | Database username |
| `SPRING_DATASOURCE_PASSWORD` | dev | Database password |
| `JWT_SECRET` | (dev default) | JWT signing secret (min 256 bits) |
| `FLYWAY_URL` | - | JDBC URL for migrations (CLI only) |
| `FLYWAY_USER` | - | Database user for migrations (CLI only) |
| `FLYWAY_PASSWORD` | - | Database password for migrations (CLI only) |

### Profiles

- **default**: Local development with localhost PostgreSQL
- **dev**: Docker development with container networking (Flyway enabled)
- **test**: H2 in-memory database for tests (uses H2 migrations)
- **integration-test**: PostgreSQL in Docker for integration tests
- **prod**: Production settings (Flyway disabled - migrations run separately)

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
