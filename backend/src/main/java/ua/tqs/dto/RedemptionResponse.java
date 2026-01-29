package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Redemption;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedemptionResponse {

    private Long id;
    private String code;
    private Integer pointsSpent;
    private LocalDateTime redeemedAt;
    private LocalDateTime usedAt;
    private RewardSummary reward;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardSummary {
        private Long id;
        private String title;
        private String type;
        private String partnerName;
    }

    public static RedemptionResponse fromRedemption(Redemption redemption) {
        RewardSummary rewardSummary = RewardSummary.builder()
                .id(redemption.getReward().getId())
                .title(redemption.getReward().getTitle())
                .type(redemption.getReward().getType().name())
                .partnerName(redemption.getReward().getPartner() != null 
                        ? redemption.getReward().getPartner().getName() 
                        : null)
                .build();

        return RedemptionResponse.builder()
                .id(redemption.getId())
                .code(redemption.getCode())
                .pointsSpent(redemption.getPointsSpent())
                .redeemedAt(redemption.getRedeemedAt())
                .usedAt(redemption.getUsedAt())
                .reward(rewardSummary)
                .build();
    }
}
