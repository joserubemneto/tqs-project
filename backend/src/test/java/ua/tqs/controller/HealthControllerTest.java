package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for HealthController.
 * 
 * Test Strategy:
 * - Unit tests: Test controller logic in isolation (fast, no Spring context)
 * - Focus on: response status, response body structure, response values
 * 
 * For integration tests with full HTTP stack, see HealthControllerIT.java
 */
class HealthControllerTest {

    private HealthController healthController;

    @BeforeEach
    void setUp() {
        healthController = new HealthController();
    }

    @Nested
    @DisplayName("GET /api/health")
    class HealthEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK status")
        void shouldReturnOkStatus() {
            ResponseEntity<Map<String, Object>> response = healthController.health();
            
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return non-null response body")
        void shouldReturnNonNullBody() {
            ResponseEntity<Map<String, Object>> response = healthController.health();
            
            assertThat(response.getBody()).isNotNull();
        }

        @Test
        @DisplayName("should return status UP")
        void shouldReturnStatusUp() {
            ResponseEntity<Map<String, Object>> response = healthController.health();
            
            assertThat(response.getBody())
                .containsEntry("status", "UP");
        }

        @Test
        @DisplayName("should return correct service name")
        void shouldReturnCorrectServiceName() {
            ResponseEntity<Map<String, Object>> response = healthController.health();
            
            assertThat(response.getBody())
                .containsEntry("service", "UA Volunteering Platform");
        }

        @Test
        @DisplayName("should include timestamp in response")
        void shouldIncludeTimestamp() {
            LocalDateTime before = LocalDateTime.now();
            
            ResponseEntity<Map<String, Object>> response = healthController.health();
            
            LocalDateTime after = LocalDateTime.now();
            
            assertThat(response.getBody()).containsKey("timestamp");
            LocalDateTime timestamp = (LocalDateTime) response.getBody().get("timestamp");
            assertThat(timestamp)
                .isAfterOrEqualTo(before)
                .isBeforeOrEqualTo(after);
        }

        @Test
        @DisplayName("should return exactly 3 fields in response")
        void shouldReturnExactlyThreeFields() {
            ResponseEntity<Map<String, Object>> response = healthController.health();
            
            assertThat(response.getBody())
                .hasSize(3)
                .containsKeys("status", "service", "timestamp");
        }

        @Test
        @DisplayName("should return consistent response on multiple calls")
        void shouldReturnConsistentResponseOnMultipleCalls() {
            ResponseEntity<Map<String, Object>> response1 = healthController.health();
            ResponseEntity<Map<String, Object>> response2 = healthController.health();
            
            assertThat(response1.getBody().get("status"))
                .isEqualTo(response2.getBody().get("status"));
            assertThat(response1.getBody().get("service"))
                .isEqualTo(response2.getBody().get("service"));
        }
    }
}
