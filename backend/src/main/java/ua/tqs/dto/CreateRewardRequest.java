package ua.tqs.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.enums.RewardType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRewardRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    @NotNull(message = "Points cost is required")
    @Min(value = 1, message = "Points cost must be at least 1")
    private Integer pointsCost;

    @NotNull(message = "Reward type is required")
    private RewardType type;

    private Long partnerId;

    @Min(value = 0, message = "Quantity must be at least 0")
    private Integer quantity;

    private LocalDateTime availableFrom;

    private LocalDateTime availableUntil;
}
