package ua.tqs.config;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

public abstract class PostgresTestContainerConfig {

    private static final String POSTGRES_IMAGE = "postgres:16-alpine";
    private static final String DATABASE_NAME = "volunteering_test";
    private static final String DATABASE_USERNAME = "testuser";
    private static final String DATABASE_PASSWORD = "testpass";

    /**
     * Lazy-initialized PostgreSQL container - started only when Docker is available.
     */
    @SuppressWarnings("resource")  // Container lifecycle managed manually
    protected static PostgreSQLContainer<?> postgres;

    private static boolean dockerAvailable;
    private static boolean initialized = false;

    /**
     * Check if Docker is available and initialize the container if so.
     * This method is called lazily to avoid class initialization failures.
     */
    private static synchronized void initializeContainer() {
        if (initialized) {
            return;
        }
        initialized = true;
        
        // Check Docker availability with comprehensive exception handling
        try {
            // First check if Docker client can be created
            DockerClientFactory factory = DockerClientFactory.instance();
            dockerAvailable = factory.isDockerAvailable();
            
            // Even if isDockerAvailable returns true, verify by checking client
            if (dockerAvailable) {
                factory.client(); // This will throw if Docker is not really available
            }
        } catch (IllegalStateException | ExceptionInInitializerError e) {
            // Docker is not available or not running
            dockerAvailable = false;
        } catch (Exception e) {
            // Any other exception means Docker is not available
            dockerAvailable = false;
        }
        
        if (dockerAvailable) {
            try {
                postgres = new PostgreSQLContainer<>(POSTGRES_IMAGE)
                        .withDatabaseName(DATABASE_NAME)
                        .withUsername(DATABASE_USERNAME)
                        .withPassword(DATABASE_PASSWORD)
                        .withReuse(true);
                postgres.start();
            } catch (Exception e) {
                // Container failed to start
                dockerAvailable = false;
                postgres = null;
            }
        }
    }

    /**
     * Ensure Docker is available before running any tests.
     * Tests are skipped if Docker is not available.
     */
    @BeforeAll
    static void checkDockerAvailable() {
        initializeContainer();
        assumeTrue(dockerAvailable, "Docker is not available - skipping container tests");
    }

    /**
     * Dynamically configure Spring datasource properties to use the Testcontainer.
     * This method is called by Spring before the application context is created.
     * 
     * IMPORTANT: These properties override any profile-specific settings (e.g., application-test.yml)
     * to ensure PostgreSQL is used instead of H2 for container-based integration tests.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Initialize container if not already done
        initializeContainer();
        
        // Only configure if Docker is available and container is running
        if (!dockerAvailable || postgres == null || !postgres.isRunning()) {
            return;
        }
        
        // Datasource configuration for PostgreSQL
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        
        // Enable Flyway migrations for real database tests
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
        
        // Configure JPA for PostgreSQL - MUST override H2 dialect from application-test.yml
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.show-sql", () -> "true");
        registry.add("spring.jpa.properties.hibernate.format_sql", () -> "true");
        // Override H2 dialect with PostgreSQL - this is critical!
        // spring.jpa.database-platform is the Spring Boot standard way to set the Hibernate dialect
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.PostgreSQLDialect");
    }
}
