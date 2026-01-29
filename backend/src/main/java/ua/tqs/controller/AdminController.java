package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.UpdateRoleRequest;
import ua.tqs.dto.UserPageResponse;
import ua.tqs.dto.UserResponse;
import ua.tqs.model.enums.UserRole;
import ua.tqs.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin user management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Get a paginated list of all users with optional search and role filter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved users"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not an admin")
    })
    public ResponseEntity<UserPageResponse> getUsers(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Search term for name or email")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by role")
            @RequestParam(required = false) UserRole role,
            @Parameter(description = "Sort field (e.g., 'name', 'email', 'createdAt')")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction ('asc' or 'desc')")
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        UserPageResponse response = adminService.getUsers(pageable, search, role);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update user role", description = "Update a user's role. Admins cannot change their own role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated user role"),
            @ApiResponse(responseCode = "400", description = "Bad request - Cannot change own role"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not an admin"),
            @ApiResponse(responseCode = "404", description = "Not found - User does not exist")
    })
    public ResponseEntity<UserResponse> updateUserRole(
            @Parameter(description = "User ID")
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal JwtUserDetails currentUser
    ) {
        UserResponse response = adminService.updateUserRole(id, request.getRole(), currentUser.getUserId());
        return ResponseEntity.ok(response);
    }
}
