package ua.tqs.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for updating an existing opportunity.
 * All fields are optional - only provided fields will be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOpportunityRequest {

    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @Size(min = 1, max = 2000, message = "Description must be between 1 and 2000 characters")
    private String description;

    @Min(value = 0, message = "Points reward must be at least 0")
    private Integer pointsReward;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @Min(value = 1, message = "Max volunteers must be at least 1")
    private Integer maxVolunteers;

    @Size(max = 255, message = "Location must be at most 255 characters")
    private String location;

    @Size(min = 1, message = "At least one skill is required")
    private Set<Long> requiredSkillIds;

    /**
     * Check if any field is provided for update.
     */
    public boolean hasUpdates() {
        return title != null || description != null || pointsReward != null ||
               startDate != null || endDate != null || maxVolunteers != null ||
               location != null || requiredSkillIds != null;
    }
}
