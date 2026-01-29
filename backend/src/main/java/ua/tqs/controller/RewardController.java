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
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.CreateRewardRequest;
import ua.tqs.dto.RewardResponse;
import ua.tqs.dto.UpdateRewardRequest;
import ua.tqs.service.RewardService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Rewards", description = "Reward management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class RewardController {

    private final RewardService rewardService;

    // ========== Public Endpoints ==========

    @GetMapping("/api/rewards")
    @SecurityRequirements  // Override class-level security - this is a public endpoint
    @Operation(summary = "Get available rewards", description = "Get all active and available rewards for volunteers (public endpoint)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved available rewards")
    })
    public ResponseEntity<List<RewardResponse>> getAvailableRewards() {
        return ResponseEntity.ok(rewardService.getAvailableRewards());
    }

    @GetMapping("/api/rewards/{id}")
    @SecurityRequirements  // Override class-level security - this is a public endpoint
    @Operation(summary = "Get reward by ID", description = "Get a single reward by its ID (public endpoint)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved reward"),
            @ApiResponse(responseCode = "404", description = "Reward not found")
    })
    public ResponseEntity<RewardResponse> getRewardById(
            @Parameter(description = "Reward ID")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(rewardService.getRewardById(id));
    }

    // ========== Admin Endpoints ==========

    @GetMapping("/api/admin/rewards")
    @Operation(summary = "Get all rewards (admin)", description = "Get all rewards with pagination (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved rewards"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role")
    })
    public ResponseEntity<Page<RewardResponse>> getAllRewards(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field (e.g., 'pointsCost', 'title', 'createdAt')")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction ('asc' or 'desc')")
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(rewardService.getAllRewards(pageable));
    }

    @PostMapping("/api/admin/rewards")
    @Operation(summary = "Create a new reward", description = "Create a new reward (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully created reward"),
            @ApiResponse(responseCode = "400", description = "Bad request - Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @ApiResponse(responseCode = "404", description = "Partner not found")
    })
    public ResponseEntity<RewardResponse> createReward(
            @Valid @RequestBody CreateRewardRequest request
    ) {
        RewardResponse response = rewardService.createReward(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/api/admin/rewards/{id}")
    @Operation(summary = "Update a reward", description = "Update an existing reward (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated reward"),
            @ApiResponse(responseCode = "400", description = "Bad request - Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @ApiResponse(responseCode = "404", description = "Reward or Partner not found")
    })
    public ResponseEntity<RewardResponse> updateReward(
            @Parameter(description = "Reward ID")
            @PathVariable Long id,
            @Valid @RequestBody UpdateRewardRequest request
    ) {
        return ResponseEntity.ok(rewardService.updateReward(id, request));
    }

    @DeleteMapping("/api/admin/rewards/{id}")
    @Operation(summary = "Deactivate a reward", description = "Deactivate (soft delete) a reward (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Successfully deactivated reward"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @ApiResponse(responseCode = "404", description = "Reward not found")
    })
    public ResponseEntity<Void> deactivateReward(
            @Parameter(description = "Reward ID")
            @PathVariable Long id
    ) {
        rewardService.deactivateReward(id);
        return ResponseEntity.noContent().build();
    }
}
