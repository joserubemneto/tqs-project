package ua.tqs.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for HealthController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Validates HTTP response codes, headers, and body
 * - Uses H2 in-memory database (test profile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerIT {

    @Autowired
    private MockMvcTester mvc;

    @Test
    @DisplayName("GET /api/health should return 200 OK")
    void healthEndpoint_ShouldReturnOk() {
        assertThat(mvc.get().uri("/api/health"))
            .hasStatusOk();
    }

    @Test
    @DisplayName("GET /api/health should return JSON content type")
    void healthEndpoint_ShouldReturnJsonContentType() {
        assertThat(mvc.get().uri("/api/health"))
            .hasStatusOk()
            .hasContentTypeCompatibleWith("application/json");
    }

    @Test
    @DisplayName("GET /api/health should return status UP in body")
    void healthEndpoint_ShouldReturnStatusUp() {
        assertThat(mvc.get().uri("/api/health"))
            .hasStatusOk()
            .bodyJson()
            .extractingPath("$.status")
            .isEqualTo("UP");
    }

    @Test
    @DisplayName("GET /api/health should return service name in body")
    void healthEndpoint_ShouldReturnServiceName() {
        assertThat(mvc.get().uri("/api/health"))
            .hasStatusOk()
            .bodyJson()
            .extractingPath("$.service")
            .isEqualTo("UA Volunteering Platform");
    }

    @Test
    @DisplayName("GET /api/health should include timestamp in body")
    void healthEndpoint_ShouldIncludeTimestamp() {
        assertThat(mvc.get().uri("/api/health"))
            .hasStatusOk()
            .bodyJson()
            .extractingPath("$.timestamp")
            .isNotNull();
    }

    @Test
    @DisplayName("GET /api/health should return complete response structure")
    void healthEndpoint_ShouldReturnCompleteStructure() {
        var response = mvc.get().uri("/api/health");
        assertThat(response).hasStatusOk();
        assertThat(response).bodyJson().extractingPath("$.status").isNotNull();
        assertThat(response).bodyJson().extractingPath("$.service").isNotNull();
        assertThat(response).bodyJson().extractingPath("$.timestamp").isNotNull();
    }

    @Test
    @DisplayName("Health endpoint should be accessible without authentication")
    void healthEndpoint_ShouldBePublic() {
        assertThat(mvc.get().uri("/api/health"))
            .hasStatusOk();
    }
}
