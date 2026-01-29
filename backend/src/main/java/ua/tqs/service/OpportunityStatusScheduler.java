package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.Opportunity;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.repository.OpportunityRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled service that automatically updates opportunity statuses based on dates.
 * - OPEN/FULL → IN_PROGRESS when startDate passes
 * - IN_PROGRESS → COMPLETED when endDate passes
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpportunityStatusScheduler {

    private final OpportunityRepository opportunityRepository;

    /**
     * Run every minute to check and update opportunity statuses.
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    @Transactional
    public void updateOpportunityStatuses() {
        LocalDateTime now = LocalDateTime.now();

        // Transition OPEN/FULL → IN_PROGRESS
        int startedCount = startOpportunities(now);

        // Transition IN_PROGRESS → COMPLETED
        int completedCount = completeOpportunities(now);

        if (startedCount > 0 || completedCount > 0) {
            log.info("Status update: {} opportunities started, {} opportunities completed", 
                    startedCount, completedCount);
        }
    }

    /**
     * Start opportunities that have reached their start date.
     * Transitions OPEN or FULL → IN_PROGRESS
     */
    private int startOpportunities(LocalDateTime now) {
        List<OpportunityStatus> statusesToStart = List.of(
                OpportunityStatus.OPEN,
                OpportunityStatus.FULL
        );

        List<Opportunity> opportunitiesToStart = opportunityRepository.findOpportunitiesToStart(
                statusesToStart, now);

        for (Opportunity opportunity : opportunitiesToStart) {
            opportunity.setStatus(OpportunityStatus.IN_PROGRESS);
            opportunityRepository.save(opportunity);
            log.debug("Started opportunity: {} (id: {})", opportunity.getTitle(), opportunity.getId());
        }

        return opportunitiesToStart.size();
    }

    /**
     * Complete opportunities that have reached their end date.
     * Transitions IN_PROGRESS → COMPLETED
     */
    private int completeOpportunities(LocalDateTime now) {
        List<Opportunity> opportunitiesToComplete = opportunityRepository.findOpportunitiesToComplete(
                OpportunityStatus.IN_PROGRESS, now);

        for (Opportunity opportunity : opportunitiesToComplete) {
            opportunity.setStatus(OpportunityStatus.COMPLETED);
            opportunityRepository.save(opportunity);
            log.debug("Completed opportunity: {} (id: {})", opportunity.getTitle(), opportunity.getId());
        }

        return opportunitiesToComplete.size();
    }
}
