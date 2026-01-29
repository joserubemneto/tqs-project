package ua.tqs.config;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Base configuration class for integration tests using Testcontainers.
 * 
 * This class provides a PostgreSQL container that is shared across all test classes
 * that extend it. Uses ApplicationContextInitializer pattern for reliable property
 * injection that works with @Nested JUnit 5 classes.
 * 
 * IMPORTANT: Tests are automatically skipped if Docker is not available.
 * 
 * Usage:
 * - Extend this class in your integration test
 * - Add @SpringBootTest and @ContextConfiguration(initializers = PostgresTestContainerConfig.Initializer.class)
 * - The PostgreSQL container will be automatically configured
 */
@ContextConfiguration(initializers = PostgresTestContainerConfig.Initializer.class)
public abstract class PostgresTestContainerConfig {

    private static final String POSTGRES_IMAGE = "postgres:16-alpine";
    private static final String DATABASE_NAME = "volunteering_test";
    private static final String DATABASE_USERNAME = "testuser";
    private static final String DATABASE_PASSWORD = "testpass";

    /**
     * Singleton PostgreSQL container - started once and shared across all tests.
     */
    @SuppressWarnings("resource")
    protected static PostgreSQLContainer<?> postgres;

    private static boolean dockerAvailable = false;
    private static boolean initialized = false;

    /**
     * Check if Docker is available and initialize the container if so.
     */
    private static synchronized void initializeContainer() {
        if (initialized) {
            return;
        }
        initialized = true;

        try {
            DockerClientFactory factory = DockerClientFactory.instance();
            dockerAvailable = factory.isDockerAvailable();
            if (dockerAvailable) {
                factory.client();
            }
        } catch (Exception e) {
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
                dockerAvailable = false;
                postgres = null;
            }
        }
    }

    /**
     * Skip tests if Docker is not available.
     */
    @BeforeAll
    static void checkDockerAvailable() {
        initializeContainer();
        assumeTrue(dockerAvailable, "Docker is not available - skipping container tests");
    }

    /**
     * ApplicationContextInitializer that configures Spring properties for PostgreSQL.
     * This approach works reliably with @Nested JUnit 5 classes.
     */
    public static class Initializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            initializeContainer();
            
            if (!dockerAvailable || postgres == null || !postgres.isRunning()) {
                // Use H2 fallback when Docker is not available
                return;
            }

            TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                    // Datasource
                    "spring.datasource.url=" + postgres.getJdbcUrl(),
                    "spring.datasource.username=" + postgres.getUsername(),
                    "spring.datasource.password=" + postgres.getPassword(),
                    "spring.datasource.driver-class-name=org.postgresql.Driver",
                    // Flyway
                    "spring.flyway.enabled=true",
                    "spring.flyway.locations=classpath:db/migration",
                    // JPA - must override H2 settings
                    "spring.jpa.hibernate.ddl-auto=validate",
                    "spring.jpa.show-sql=true",
                    "spring.jpa.properties.hibernate.format_sql=true",
                    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
            );
        }
    }
}
