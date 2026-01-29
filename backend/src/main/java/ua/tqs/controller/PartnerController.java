package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.tqs.dto.PartnerResponse;
import ua.tqs.repository.PartnerRepository;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Partners", description = "Partner management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PartnerController {

    private final PartnerRepository partnerRepository;

    @GetMapping("/api/admin/partners")
    @Operation(summary = "Get all active partners", description = "Get all active partners for reward association (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved partners"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role")
    })
    public ResponseEntity<List<PartnerResponse>> getActivePartners() {
        List<PartnerResponse> partners = partnerRepository.findByActiveTrue()
                .stream()
                .map(PartnerResponse::fromPartner)
                .toList();
        return ResponseEntity.ok(partners);
    }
}
