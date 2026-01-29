package ua.tqs.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOpportunityRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be at most 2000 characters")
    private String description;

    @NotNull(message = "Points reward is required")
    @Min(value = 0, message = "Points reward must be at least 0")
    private Integer pointsReward;

    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;

    @NotNull(message = "End date is required")
    private LocalDateTime endDate;

    @NotNull(message = "Max volunteers is required")
    @Min(value = 1, message = "Max volunteers must be at least 1")
    private Integer maxVolunteers;

    @Size(max = 255, message = "Location must be at most 255 characters")
    private String location;

    @NotEmpty(message = "At least one skill is required")
    private Set<Long> requiredSkillIds;
}
