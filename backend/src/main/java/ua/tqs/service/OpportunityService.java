package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityFilterRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.exception.OpportunityNotFoundException;
import ua.tqs.exception.OpportunityValidationException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.specification.OpportunitySpecification;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    /**
     * Create a new volunteering opportunity.
     */
    @Transactional
    public OpportunityResponse createOpportunity(Long promoterId, CreateOpportunityRequest request) {
        // Validate end date is after start date
        if (request.getEndDate().isBefore(request.getStartDate()) || 
            request.getEndDate().isEqual(request.getStartDate())) {
            throw new OpportunityValidationException("End date must be after start date");
        }

        // Validate at least one skill is required
        if (request.getRequiredSkillIds() == null || request.getRequiredSkillIds().isEmpty()) {
            throw new OpportunityValidationException("At least one skill is required");
        }

        // Get the promoter
        User promoter = userRepository.findById(promoterId)
                .orElseThrow(() -> new UserNotFoundException(promoterId));

        // Get and validate required skills
        Set<Skill> requiredSkills = new HashSet<>();
        for (Long skillId : request.getRequiredSkillIds()) {
            Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> new OpportunityValidationException(
                            "Skill not found with id: " + skillId));
            requiredSkills.add(skill);
        }

        // Build the opportunity entity
        Opportunity opportunity = Opportunity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .pointsReward(request.getPointsReward())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxVolunteers(request.getMaxVolunteers())
                .status(OpportunityStatus.DRAFT)
                .location(request.getLocation())
                .promoter(promoter)
                .requiredSkills(requiredSkills)
                .build();

        Opportunity savedOpportunity = opportunityRepository.save(opportunity);
        log.info("Created opportunity '{}' (id: {}) by promoter {}", 
                savedOpportunity.getTitle(), savedOpportunity.getId(), promoterId);

        return OpportunityResponse.fromOpportunity(savedOpportunity);
    }

    /**
     * Get all opportunities created by a specific promoter.
     */
    @Transactional(readOnly = true)
    public List<OpportunityResponse> getOpportunitiesByPromoter(Long promoterId) {
        User promoter = userRepository.findById(promoterId)
                .orElseThrow(() -> new UserNotFoundException(promoterId));

        List<Opportunity> opportunities = opportunityRepository.findByPromoter(promoter);
        log.debug("Retrieved {} opportunities for promoter {}", opportunities.size(), promoterId);

        return opportunities.stream()
                .map(OpportunityResponse::fromOpportunity)
                .collect(Collectors.toList());
    }

    /**
     * Get a single opportunity by ID (public endpoint).
     */
    @Transactional(readOnly = true)
    public OpportunityResponse getOpportunityById(Long id) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new OpportunityNotFoundException(id));
        log.debug("Retrieved opportunity '{}' (id: {})", opportunity.getTitle(), id);
        return OpportunityResponse.fromOpportunity(opportunity);
    }

    /**
     * Get all open opportunities (public endpoint).
     */
    @Transactional(readOnly = true)
    public Page<OpportunityResponse> getAllOpenOpportunities(Pageable pageable) {
        Page<Opportunity> opportunities = opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable);
        log.debug("Retrieved {} open opportunities", opportunities.getTotalElements());
        return opportunities.map(OpportunityResponse::fromOpportunity);
    }

    /**
     * Get filtered open opportunities (public endpoint).
     */
    @Transactional(readOnly = true)
    public Page<OpportunityResponse> getFilteredOpportunities(OpportunityFilterRequest filter, Pageable pageable) {
        Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);
        Page<Opportunity> opportunities = opportunityRepository.findAll(spec, pageable);
        
        if (filter != null && filter.hasFilters()) {
            log.debug("Retrieved {} filtered opportunities (filters: skills={}, dateFrom={}, dateTo={}, minPoints={}, maxPoints={})",
                    opportunities.getTotalElements(),
                    filter.getSkillIds(),
                    filter.getStartDateFrom(),
                    filter.getStartDateTo(),
                    filter.getMinPoints(),
                    filter.getMaxPoints());
        } else {
            log.debug("Retrieved {} open opportunities (no filters)", opportunities.getTotalElements());
        }
        
        return opportunities.map(OpportunityResponse::fromOpportunity);
    }
}
