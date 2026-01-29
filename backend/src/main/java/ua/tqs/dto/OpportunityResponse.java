package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Opportunity;
import ua.tqs.model.enums.OpportunityStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityResponse {
    private Long id;
    private String title;
    private String description;
    private Integer pointsReward;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer maxVolunteers;
    private OpportunityStatus status;
    private String location;
    private UserResponse promoter;
    private List<SkillResponse> requiredSkills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OpportunityResponse fromOpportunity(Opportunity opportunity) {
        List<SkillResponse> skillResponses = opportunity.getRequiredSkills().stream()
                .map(SkillResponse::fromSkill)
                .collect(Collectors.toList());

        return OpportunityResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .pointsReward(opportunity.getPointsReward())
                .startDate(opportunity.getStartDate())
                .endDate(opportunity.getEndDate())
                .maxVolunteers(opportunity.getMaxVolunteers())
                .status(opportunity.getStatus())
                .location(opportunity.getLocation())
                .promoter(UserResponse.fromUser(opportunity.getPromoter()))
                .requiredSkills(skillResponses)
                .createdAt(opportunity.getCreatedAt())
                .updatedAt(opportunity.getUpdatedAt())
                .build();
    }
}
