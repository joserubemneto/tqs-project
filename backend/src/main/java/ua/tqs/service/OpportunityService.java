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
import ua.tqs.dto.UpdateOpportunityRequest;
import ua.tqs.exception.OpportunityNotFoundException;
import ua.tqs.exception.OpportunityOwnershipException;
import ua.tqs.exception.OpportunityStatusException;
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

import java.time.LocalDateTime;
import java.util.EnumSet;
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

    /**
     * Update an existing opportunity.
     * Only opportunities in DRAFT or OPEN status can be edited.
     * Only the promoter who created it or an admin can edit.
     */
    @Transactional
    public OpportunityResponse updateOpportunity(Long userId, Long opportunityId, 
                                                  UpdateOpportunityRequest request, boolean isAdmin) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new OpportunityNotFoundException(opportunityId));

        // Validate ownership
        validateOwnership(opportunity, userId, isAdmin);

        // Validate status allows editing
        validateEditableStatus(opportunity.getStatus());

        // Apply updates only for non-null fields
        if (request.getTitle() != null) {
            opportunity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            opportunity.setDescription(request.getDescription());
        }
        if (request.getPointsReward() != null) {
            opportunity.setPointsReward(request.getPointsReward());
        }
        if (request.getLocation() != null) {
            opportunity.setLocation(request.getLocation());
        }

        // Handle date updates with validation
        LocalDateTime newStartDate = request.getStartDate() != null ? request.getStartDate() : opportunity.getStartDate();
        LocalDateTime newEndDate = request.getEndDate() != null ? request.getEndDate() : opportunity.getEndDate();

        if (newEndDate.isBefore(newStartDate) || newEndDate.isEqual(newStartDate)) {
            throw new OpportunityValidationException("End date must be after start date");
        }

        if (request.getStartDate() != null) {
            opportunity.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            opportunity.setEndDate(request.getEndDate());
        }

        // Handle maxVolunteers update with enrolled count validation
        if (request.getMaxVolunteers() != null) {
            int enrolledCount = opportunity.getApplications() != null ? opportunity.getApplications().size() : 0;
            if (request.getMaxVolunteers() < enrolledCount) {
                throw new OpportunityValidationException(
                        "Cannot reduce max volunteers below current enrollment");
            }
            opportunity.setMaxVolunteers(request.getMaxVolunteers());
        }

        // Handle skills update
        if (request.getRequiredSkillIds() != null) {
            if (request.getRequiredSkillIds().isEmpty()) {
                throw new OpportunityValidationException("At least one skill is required");
            }
            Set<Skill> requiredSkills = new HashSet<>();
            for (Long skillId : request.getRequiredSkillIds()) {
                Skill skill = skillRepository.findById(skillId)
                        .orElseThrow(() -> new OpportunityValidationException(
                                "Skill not found with id: " + skillId));
                requiredSkills.add(skill);
            }
            opportunity.setRequiredSkills(requiredSkills);
        }

        Opportunity savedOpportunity = opportunityRepository.save(opportunity);
        log.info("Updated opportunity '{}' (id: {}) by user {}", 
                savedOpportunity.getTitle(), savedOpportunity.getId(), userId);

        return OpportunityResponse.fromOpportunity(savedOpportunity);
    }

    /**
     * Cancel an opportunity.
     * Only opportunities in DRAFT, OPEN, or FULL status can be cancelled.
     * Only the promoter who created it or an admin can cancel.
     */
    @Transactional
    public OpportunityResponse cancelOpportunity(Long userId, Long opportunityId, boolean isAdmin) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new OpportunityNotFoundException(opportunityId));

        // Validate ownership
        validateOwnership(opportunity, userId, isAdmin);

        // Validate status allows cancellation
        validateCancellableStatus(opportunity.getStatus());

        opportunity.setStatus(OpportunityStatus.CANCELLED);

        Opportunity savedOpportunity = opportunityRepository.save(opportunity);
        log.info("Cancelled opportunity '{}' (id: {}) by user {}", 
                savedOpportunity.getTitle(), savedOpportunity.getId(), userId);

        return OpportunityResponse.fromOpportunity(savedOpportunity);
    }

    /**
     * Publish an opportunity (change status from DRAFT to OPEN).
     * Only opportunities in DRAFT status can be published.
     * Only the promoter who created it or an admin can publish.
     */
    @Transactional
    public OpportunityResponse publishOpportunity(Long userId, Long opportunityId, boolean isAdmin) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new OpportunityNotFoundException(opportunityId));

        // Validate ownership
        validateOwnership(opportunity, userId, isAdmin);

        // Validate status is DRAFT
        if (opportunity.getStatus() != OpportunityStatus.DRAFT) {
            throw new OpportunityStatusException("Only DRAFT opportunities can be published");
        }

        opportunity.setStatus(OpportunityStatus.OPEN);

        Opportunity savedOpportunity = opportunityRepository.save(opportunity);
        log.info("Published opportunity '{}' (id: {}) by user {}", 
                savedOpportunity.getTitle(), savedOpportunity.getId(), userId);

        return OpportunityResponse.fromOpportunity(savedOpportunity);
    }

    /**
     * Get all opportunities for admin view with optional status filter.
     */
    @Transactional(readOnly = true)
    public Page<OpportunityResponse> getAllOpportunitiesForAdmin(Pageable pageable, OpportunityStatus status) {
        Page<Opportunity> opportunities;
        if (status != null) {
            opportunities = opportunityRepository.findByStatus(status, pageable);
            log.debug("Retrieved {} opportunities with status {} for admin", opportunities.getTotalElements(), status);
        } else {
            opportunities = opportunityRepository.findAll(pageable);
            log.debug("Retrieved {} total opportunities for admin", opportunities.getTotalElements());
        }
        return opportunities.map(OpportunityResponse::fromOpportunity);
    }

    /**
     * Validate that the user owns the opportunity or is an admin.
     */
    private void validateOwnership(Opportunity opportunity, Long userId, boolean isAdmin) {
        if (!isAdmin && !opportunity.getPromoter().getId().equals(userId)) {
            throw new OpportunityOwnershipException();
        }
    }

    /**
     * Validate that the opportunity status allows editing.
     * Only DRAFT and OPEN opportunities can be edited.
     */
    private void validateEditableStatus(OpportunityStatus status) {
        Set<OpportunityStatus> editableStatuses = EnumSet.of(
                OpportunityStatus.DRAFT, 
                OpportunityStatus.OPEN
        );
        if (!editableStatuses.contains(status)) {
            throw new OpportunityStatusException("Cannot edit opportunity in current status");
        }
    }

    /**
     * Validate that the opportunity status allows cancellation.
     * Only DRAFT, OPEN, and FULL opportunities can be cancelled.
     */
    private void validateCancellableStatus(OpportunityStatus status) {
        if (status == OpportunityStatus.CANCELLED) {
            throw new OpportunityStatusException("Opportunity is already cancelled");
        }
        if (status == OpportunityStatus.IN_PROGRESS) {
            throw new OpportunityStatusException("Cannot cancel opportunity in progress");
        }
        if (status == OpportunityStatus.COMPLETED) {
            throw new OpportunityStatusException("Cannot cancel completed opportunity");
        }
    }
}
