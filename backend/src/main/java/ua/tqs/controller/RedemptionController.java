package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.RedemptionResponse;
import ua.tqs.service.RedemptionService;

import java.util.List;

@RestController
@RequestMapping("/api/redemptions")
@RequiredArgsConstructor
@Tag(name = "Redemptions", description = "Reward redemption endpoints")
@SecurityRequirement(name = "bearerAuth")
public class RedemptionController {

    private final RedemptionService redemptionService;

    @PostMapping("/rewards/{rewardId}")
    @PreAuthorize("hasRole('VOLUNTEER')")
    @Operation(summary = "Redeem a reward", description = "Redeem a reward using points (VOLUNTEER only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully redeemed reward"),
            @ApiResponse(responseCode = "400", description = "Bad request - Insufficient points or reward not available"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not a volunteer"),
            @ApiResponse(responseCode = "404", description = "Reward not found")
    })
    public ResponseEntity<RedemptionResponse> redeemReward(
            @Parameter(description = "Reward ID to redeem")
            @PathVariable Long rewardId,
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        RedemptionResponse response = redemptionService.redeemReward(currentUser.getUserId(), rewardId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('VOLUNTEER')")
    @Operation(summary = "Get my redemptions", description = "Get all redemptions made by the current user (VOLUNTEER only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved redemptions"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not a volunteer")
    })
    public ResponseEntity<List<RedemptionResponse>> getMyRedemptions(
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        List<RedemptionResponse> redemptions = redemptionService.getUserRedemptions(currentUser.getUserId());
        return ResponseEntity.ok(redemptions);
    }
}
