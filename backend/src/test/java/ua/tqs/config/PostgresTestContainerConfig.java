package ua.tqs.config;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base configuration class for integration tests using Testcontainers.
 * 
 * This class provides a PostgreSQL container that is shared across all test classes
 * that extend it. The container is started once and reused, improving test performance.
 * 
 * Tests extending this class will be automatically skipped if Docker is not available
 * (controlled by disabledWithoutDocker = true).
 * 
 * Usage:
 * - Extend this class in your integration test
 * - Add @SpringBootTest annotation to your test class
 * - The PostgreSQL container will be automatically configured
 * 
 * Example:
 * {@code
 * @SpringBootTest
 * class MyRepositoryContainerIT extends PostgresTestContainerConfig {
 *     // tests here
 * }
 * }
 */
@Testcontainers(disabledWithoutDocker = true)
public abstract class PostgresTestContainerConfig {

    private static final String POSTGRES_IMAGE = "postgres:16-alpine";
    private static final String DATABASE_NAME = "volunteering_test";
    private static final String DATABASE_USERNAME = "testuser";
    private static final String DATABASE_PASSWORD = "testpass";

    @Container
    @SuppressWarnings("resource")  // Container lifecycle managed by Testcontainers
    protected static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(POSTGRES_IMAGE)
            .withDatabaseName(DATABASE_NAME)
            .withUsername(DATABASE_USERNAME)
            .withPassword(DATABASE_PASSWORD)
            .withReuse(true);

    /**
     * Dynamically configure Spring datasource properties to use the Testcontainer.
     * This method is called by Spring before the application context is created.
     * 
     * IMPORTANT: These properties override any profile-specific settings (e.g., application-test.yml)
     * to ensure PostgreSQL is used instead of H2 for container-based integration tests.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Ensure container is started before accessing its properties
        postgres.start();
        
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
