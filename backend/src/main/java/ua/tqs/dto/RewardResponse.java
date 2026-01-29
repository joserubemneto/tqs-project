package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Reward;
import ua.tqs.model.enums.RewardType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardResponse {
    private Long id;
    private String title;
    private String description;
    private Integer pointsCost;
    private RewardType type;
    private PartnerResponse partner;
    private Integer quantity;
    private Integer remainingQuantity;
    private Boolean active;
    private LocalDateTime availableFrom;
    private LocalDateTime availableUntil;
    private LocalDateTime createdAt;

    public static RewardResponse fromReward(Reward reward) {
        return fromReward(reward, null);
    }

    public static RewardResponse fromReward(Reward reward, Long redemptionCount) {
        Integer remaining = null;
        if (reward.getQuantity() != null) {
            long count = redemptionCount != null ? redemptionCount : 0;
            remaining = Math.max(0, reward.getQuantity() - (int) count);
        }

        return RewardResponse.builder()
                .id(reward.getId())
                .title(reward.getTitle())
                .description(reward.getDescription())
                .pointsCost(reward.getPointsCost())
                .type(reward.getType())
                .partner(PartnerResponse.fromPartner(reward.getPartner()))
                .quantity(reward.getQuantity())
                .remainingQuantity(remaining)
                .active(reward.getActive())
                .availableFrom(reward.getAvailableFrom())
                .availableUntil(reward.getAvailableUntil())
                .createdAt(reward.getCreatedAt())
                .build();
    }
}
