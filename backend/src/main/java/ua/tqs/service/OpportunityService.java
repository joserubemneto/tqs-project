package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.exception.OpportunityValidationException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;

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
}
