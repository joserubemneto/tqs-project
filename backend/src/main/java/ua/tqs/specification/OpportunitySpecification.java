package ua.tqs.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import ua.tqs.dto.OpportunityFilterRequest;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.enums.OpportunityStatus;

import java.util.ArrayList;
import java.util.List;

public class OpportunitySpecification {

    private OpportunitySpecification() {
        // Utility class
    }

    /**
     * Build a specification for filtering opportunities based on the filter request.
     */
    public static Specification<Opportunity> withFilters(OpportunityFilterRequest filter, OpportunityStatus status) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter by status
            predicates.add(criteriaBuilder.equal(root.get("status"), status));

            if (filter == null) {
                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            }

            // Filter by skills (OR logic - matches if opportunity has any of the selected skills)
            if (filter.getSkillIds() != null && !filter.getSkillIds().isEmpty()) {
                Join<Opportunity, Skill> skillsJoin = root.join("requiredSkills", JoinType.INNER);
                predicates.add(skillsJoin.get("id").in(filter.getSkillIds()));
                // Make results distinct to avoid duplicates when matching multiple skills
                query.distinct(true);
            }

            // Filter by start date from (opportunities starting on or after this date)
            if (filter.getStartDateFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("startDate"), filter.getStartDateFrom()));
            }

            // Filter by start date to (opportunities starting on or before this date)
            if (filter.getStartDateTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("startDate"), filter.getStartDateTo()));
            }

            // Filter by minimum points
            if (filter.getMinPoints() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("pointsReward"), filter.getMinPoints()));
            }

            // Filter by maximum points
            if (filter.getMaxPoints() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("pointsReward"), filter.getMaxPoints()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
