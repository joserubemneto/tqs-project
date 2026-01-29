package ua.tqs.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new application to an opportunity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApplicationRequest {

    @NotNull(message = "Opportunity ID is required")
    private Long opportunityId;

    @Size(max = 500, message = "Message must be at most 500 characters")
    private String message;
}
