package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.ProfileResponse;
import ua.tqs.dto.UpdateProfileRequest;
import ua.tqs.service.ProfileService;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "User profile management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "Get current user's profile", description = "Get the authenticated user's profile including skills")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved profile"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "404", description = "Not found - User does not exist")
    })
    public ResponseEntity<ProfileResponse> getProfile(
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        ProfileResponse response = profileService.getCurrentUserProfile(currentUser.getUserId());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Update current user's profile", description = "Update the authenticated user's name, bio, and skills")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated profile"),
            @ApiResponse(responseCode = "400", description = "Bad request - Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "404", description = "Not found - User does not exist")
    })
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        ProfileResponse response = profileService.updateProfile(currentUser.getUserId(), request);
        return ResponseEntity.ok(response);
    }
}
