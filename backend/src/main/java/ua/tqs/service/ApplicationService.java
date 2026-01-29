package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.ApplicationResponse;
import ua.tqs.dto.CreateApplicationRequest;
import ua.tqs.exception.AlreadyAppliedException;
import ua.tqs.exception.ApplicationNotFoundException;
import ua.tqs.exception.InvalidApplicationStatusException;
import ua.tqs.exception.NoSpotsAvailableException;
import ua.tqs.exception.OpportunityNotFoundException;
import ua.tqs.exception.OpportunityOwnershipException;
import ua.tqs.exception.OpportunityStatusException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Application;
import ua.tqs.model.Opportunity;
import ua.tqs.model.User;
import ua.tqs.model.enums.ApplicationStatus;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.ApplicationRepository;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;

    /**
     * Apply to an opportunity as a volunteer.
     * Validates that the opportunity is OPEN, has available spots, and the volunteer hasn't already applied.
     */
    @Transactional
    public ApplicationResponse applyToOpportunity(Long volunteerId, CreateApplicationRequest request) {
        // Get the volunteer
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new UserNotFoundException(volunteerId));

        // Get the opportunity
        Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                .orElseThrow(() -> new OpportunityNotFoundException(request.getOpportunityId()));

        // Validate opportunity is OPEN
        if (opportunity.getStatus() != OpportunityStatus.OPEN) {
            throw new OpportunityStatusException("Cannot apply to opportunity that is not open");
        }

        // Check if already applied
        if (applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)) {
            throw new AlreadyAppliedException();
        }

        // Check if there are available spots
        // Count approved applications (pending ones don't count against the limit)
        long approvedCount = applicationRepository.countByOpportunityAndStatus(
                opportunity, ApplicationStatus.APPROVED);
        if (approvedCount >= opportunity.getMaxVolunteers()) {
            throw new NoSpotsAvailableException();
        }

        // Create the application
        Application application = Application.builder()
                .volunteer(volunteer)
                .opportunity(opportunity)
                .status(ApplicationStatus.PENDING)
                .message(request.getMessage())
                .build();

        Application savedApplication = applicationRepository.save(application);
        log.info("Volunteer {} applied to opportunity '{}' (id: {})",
                volunteerId, opportunity.getTitle(), opportunity.getId());

        return ApplicationResponse.fromApplication(savedApplication);
    }

    /**
     * Get all applications for a volunteer.
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(Long volunteerId) {
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new UserNotFoundException(volunteerId));

        List<Application> applications = applicationRepository.findByVolunteer(volunteer);
        log.debug("Retrieved {} applications for volunteer {}", applications.size(), volunteerId);

        return applications.stream()
                .map(ApplicationResponse::fromApplication)
                .collect(Collectors.toList());
    }

    /**
     * Get the volunteer's application for a specific opportunity.
     * Returns null if the volunteer hasn't applied.
     */
    @Transactional(readOnly = true)
    public ApplicationResponse getApplicationForOpportunity(Long volunteerId, Long opportunityId) {
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new UserNotFoundException(volunteerId));

        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new OpportunityNotFoundException(opportunityId));

        Optional<Application> application = applicationRepository.findByVolunteerAndOpportunity(
                volunteer, opportunity);

        return application.map(ApplicationResponse::fromApplication).orElse(null);
    }

    /**
     * Get the count of approved applications for an opportunity.
     */
    @Transactional(readOnly = true)
    public long getApprovedApplicationCount(Long opportunityId) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new OpportunityNotFoundException(opportunityId));

        return applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED);
    }

    /**
     * Get all applications for an opportunity (for promoters/admins).
     * Validates that the requesting user is the opportunity owner or an admin.
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsForOpportunity(Long opportunityId, Long userId) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new OpportunityNotFoundException(opportunityId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Check if user is the promoter or an admin
        boolean isOwner = opportunity.getPromoter().getId().equals(userId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new OpportunityOwnershipException("Only the opportunity promoter or admin can view applications");
        }

        List<Application> applications = applicationRepository.findByOpportunity(opportunity);
        log.debug("Retrieved {} applications for opportunity {}", applications.size(), opportunityId);

        return applications.stream()
                .map(ApplicationResponse::fromApplication)
                .collect(Collectors.toList());
    }

    /**
     * Approve an application.
     * Validates that the requesting user is the opportunity owner or an admin,
     * and that there are available spots.
     */
    @Transactional
    public ApplicationResponse approveApplication(Long applicationId, Long userId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Opportunity opportunity = application.getOpportunity();

        // Check if user is the promoter or an admin
        boolean isOwner = opportunity.getPromoter().getId().equals(userId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new OpportunityOwnershipException("Only the opportunity promoter or admin can approve applications");
        }

        // Check if application is in PENDING status
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new InvalidApplicationStatusException(
                    "Cannot approve application with status: " + application.getStatus());
        }

        // Check if there are available spots
        long approvedCount = applicationRepository.countByOpportunityAndStatus(
                opportunity, ApplicationStatus.APPROVED);
        if (approvedCount >= opportunity.getMaxVolunteers()) {
            throw new NoSpotsAvailableException();
        }

        // Approve the application
        application.setStatus(ApplicationStatus.APPROVED);
        application.setReviewedAt(LocalDateTime.now());

        Application savedApplication = applicationRepository.save(application);
        log.info("Application {} approved by user {} for opportunity '{}'",
                applicationId, userId, opportunity.getTitle());

        return ApplicationResponse.fromApplication(savedApplication);
    }

    /**
     * Reject an application.
     * Validates that the requesting user is the opportunity owner or an admin.
     */
    @Transactional
    public ApplicationResponse rejectApplication(Long applicationId, Long userId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Opportunity opportunity = application.getOpportunity();

        // Check if user is the promoter or an admin
        boolean isOwner = opportunity.getPromoter().getId().equals(userId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new OpportunityOwnershipException("Only the opportunity promoter or admin can reject applications");
        }

        // Check if application is in PENDING status
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new InvalidApplicationStatusException(
                    "Cannot reject application with status: " + application.getStatus());
        }

        // Reject the application
        application.setStatus(ApplicationStatus.REJECTED);
        application.setReviewedAt(LocalDateTime.now());

        Application savedApplication = applicationRepository.save(application);
        log.info("Application {} rejected by user {} for opportunity '{}'",
                applicationId, userId, opportunity.getTitle());

        return ApplicationResponse.fromApplication(savedApplication);
    }
}
