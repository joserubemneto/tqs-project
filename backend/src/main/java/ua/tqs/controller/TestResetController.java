package ua.tqs.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.service.TestResetService;

import java.util.Map;

/**
 * Controller for resetting the database during E2E tests.
 * Only available in the integration-test profile.
 * 
 * IMPORTANT: This endpoint is intentionally NOT secured as it's only
 * available in test environments and needs to be callable without authentication.
 */
@Slf4j
@RestController
@RequestMapping("/api/test")
@Profile("integration-test")
@RequiredArgsConstructor
public class TestResetController {

    private final TestResetService testResetService;

    /**
     * Resets the database to its initial seed state.
     * This endpoint is useful for E2E test isolation.
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetDatabase() {
        log.info("Database reset requested");
        testResetService.resetDatabase();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Database reset to initial state"
        ));
    }

    /**
     * Creates an opportunity with OPEN status for E2E testing.
     * This bypasses the normal DRAFT status to allow testing volunteer applications.
     */
    @PostMapping("/opportunity")
    public ResponseEntity<OpportunityResponse> createOpenOpportunity(
            @RequestBody CreateOpportunityRequest request) {
        log.info("Creating OPEN opportunity for testing: {}", request.getTitle());
        OpportunityResponse response = testResetService.createOpenOpportunity(request);
        return ResponseEntity.ok(response);
    }
}
