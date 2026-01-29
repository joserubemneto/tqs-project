package ua.tqs.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.enums.RewardType;

import java.time.LocalDateTime;

/**
 * DTO for updating an existing reward.
 * All fields are optional - only provided fields will be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRewardRequest {

    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @Size(min = 1, max = 1000, message = "Description must be between 1 and 1000 characters")
    private String description;

    @Min(value = 1, message = "Points cost must be at least 1")
    private Integer pointsCost;

    private RewardType type;

    private Long partnerId;

    @Min(value = 0, message = "Quantity must be at least 0")
    private Integer quantity;

    private LocalDateTime availableFrom;

    private LocalDateTime availableUntil;

    private Boolean active;

    /**
     * Check if any field is provided for update.
     */
    public boolean hasUpdates() {
        return title != null || description != null || pointsCost != null ||
               type != null || partnerId != null || quantity != null ||
               availableFrom != null || availableUntil != null || active != null;
    }
}
