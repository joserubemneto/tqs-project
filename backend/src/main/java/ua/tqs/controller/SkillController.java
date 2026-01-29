package ua.tqs.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.SkillResponse;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.service.ProfileService;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Skills", description = "Skills listing endpoints (public)")
public class SkillController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "Get all skills", description = "Get all available skills, optionally filtered by category")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved skills")
    })
    public ResponseEntity<List<SkillResponse>> getSkills(
            @Parameter(description = "Filter by skill category")
            @RequestParam(required = false) SkillCategory category
    ) {
        List<SkillResponse> skills;
        if (category != null) {
            skills = profileService.getSkillsByCategory(category);
        } else {
            skills = profileService.getAllSkills();
        }
        return ResponseEntity.ok(skills);
    }
}
