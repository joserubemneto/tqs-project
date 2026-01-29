package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Application;
import ua.tqs.model.enums.ApplicationStatus;

import java.time.LocalDateTime;

/**
 * DTO for application responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private Long id;
    private ApplicationStatus status;
    private String message;
    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime completedAt;
    private OpportunitySummary opportunity;
    private UserResponse volunteer;

    /**
     * Embedded opportunity summary for application responses.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OpportunitySummary {
        private Long id;
        private String title;
        private String status;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Integer pointsReward;
        private String location;
    }

    public static ApplicationResponse fromApplication(Application application) {
        OpportunitySummary opportunitySummary = OpportunitySummary.builder()
                .id(application.getOpportunity().getId())
                .title(application.getOpportunity().getTitle())
                .status(application.getOpportunity().getStatus().name())
                .startDate(application.getOpportunity().getStartDate())
                .endDate(application.getOpportunity().getEndDate())
                .pointsReward(application.getOpportunity().getPointsReward())
                .location(application.getOpportunity().getLocation())
                .build();

        return ApplicationResponse.builder()
                .id(application.getId())
                .status(application.getStatus())
                .message(application.getMessage())
                .appliedAt(application.getAppliedAt())
                .reviewedAt(application.getReviewedAt())
                .completedAt(application.getCompletedAt())
                .opportunity(opportunitySummary)
                .volunteer(UserResponse.fromUser(application.getVolunteer()))
                .build();
    }
}
