package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.ApplicationResponse;
import ua.tqs.dto.CreateApplicationRequest;
import ua.tqs.service.ApplicationService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Volunteer application management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/applications")
    @PreAuthorize("hasRole('VOLUNTEER')")
    @Operation(summary = "Apply to an opportunity", description = "Submit an application to volunteer for an opportunity (VOLUNTEER only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully applied to opportunity"),
            @ApiResponse(responseCode = "400", description = "Bad request - Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have VOLUNTEER role"),
            @ApiResponse(responseCode = "404", description = "Opportunity not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Already applied or no spots available")
    })
    public ResponseEntity<ApplicationResponse> applyToOpportunity(
            @Valid @RequestBody CreateApplicationRequest request,
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        ApplicationResponse response = applicationService.applyToOpportunity(
                currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/applications/my")
    @PreAuthorize("hasRole('VOLUNTEER')")
    @Operation(summary = "Get my applications", description = "Get all applications submitted by the current user (VOLUNTEER only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved applications"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have VOLUNTEER role")
    })
    public ResponseEntity<List<ApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        List<ApplicationResponse> applications = applicationService.getMyApplications(currentUser.getUserId());
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/opportunities/{opportunityId}/my-application")
    @PreAuthorize("hasRole('VOLUNTEER')")
    @Operation(summary = "Get my application for an opportunity", description = "Check if the current user has applied to a specific opportunity (VOLUNTEER only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Application found"),
            @ApiResponse(responseCode = "204", description = "No application found for this opportunity"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have VOLUNTEER role"),
            @ApiResponse(responseCode = "404", description = "Opportunity not found")
    })
    public ResponseEntity<ApplicationResponse> getMyApplicationForOpportunity(
            @Parameter(description = "Opportunity ID")
            @PathVariable Long opportunityId,
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        ApplicationResponse application = applicationService.getApplicationForOpportunity(
                currentUser.getUserId(), opportunityId);
        if (application == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(application);
    }

    @GetMapping("/opportunities/{opportunityId}/application-count")
    @Operation(summary = "Get approved application count", description = "Get the count of approved applications for an opportunity (public endpoint)")
    public ResponseEntity<Long> getApprovedApplicationCount(
            @Parameter(description = "Opportunity ID")
            @PathVariable Long opportunityId
    ) {
        long count = applicationService.getApprovedApplicationCount(opportunityId);
        return ResponseEntity.ok(count);
    }
}
