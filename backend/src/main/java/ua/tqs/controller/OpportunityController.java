package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.service.OpportunityService;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
@Tag(name = "Opportunities", description = "Volunteering opportunity management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class OpportunityController {

    private final OpportunityService opportunityService;

    @GetMapping
    @SecurityRequirements  // Override class-level security - this is a public endpoint
    @Operation(summary = "Get all open opportunities", description = "Get a paginated list of all open opportunities (public endpoint)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved opportunities")
    })
    public ResponseEntity<Page<OpportunityResponse>> getAllOpportunities(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field (e.g., 'startDate', 'title', 'createdAt')")
            @RequestParam(defaultValue = "startDate") String sortBy,
            @Parameter(description = "Sort direction ('asc' or 'desc')")
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(opportunityService.getAllOpenOpportunities(pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('PROMOTER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new opportunity", description = "Create a new volunteering opportunity (PROMOTER or ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully created opportunity"),
            @ApiResponse(responseCode = "400", description = "Bad request - Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have PROMOTER or ADMIN role")
    })
    public ResponseEntity<OpportunityResponse> createOpportunity(
            @Valid @RequestBody CreateOpportunityRequest request,
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        OpportunityResponse response = opportunityService.createOpportunity(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PROMOTER') or hasRole('ADMIN')")
    @Operation(summary = "Get my opportunities", description = "Get all opportunities created by the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved opportunities"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have PROMOTER or ADMIN role")
    })
    public ResponseEntity<List<OpportunityResponse>> getMyOpportunities(
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByPromoter(currentUser.getUserId());
        return ResponseEntity.ok(opportunities);
    }
}
