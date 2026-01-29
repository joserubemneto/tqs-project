package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityFilterRequest {

    /**
     * Filter by skill IDs (OR logic - matches if opportunity has any of these skills)
     */
    private List<Long> skillIds;

    /**
     * Filter by opportunities starting on or after this date
     */
    private LocalDateTime startDateFrom;

    /**
     * Filter by opportunities starting on or before this date
     */
    private LocalDateTime startDateTo;

    /**
     * Filter by minimum points reward
     */
    private Integer minPoints;

    /**
     * Filter by maximum points reward
     */
    private Integer maxPoints;

    /**
     * Check if any filters are active
     */
    public boolean hasFilters() {
        return (skillIds != null && !skillIds.isEmpty())
                || startDateFrom != null
                || startDateTo != null
                || minPoints != null
                || maxPoints != null;
    }
}
